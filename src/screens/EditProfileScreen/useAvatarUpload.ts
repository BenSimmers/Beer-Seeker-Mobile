import { useMutation } from "convex/react";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { errorMessage } from "../../backend";
import { useToast } from "../../components/Toast";
import { socialLogger as log } from "../../logger";
import { base64ToBytes } from "../../utils/base64";

// Plenty for a 88pt circle at 3x; keeps uploads to tens of kilobytes.
const AVATAR_PX = 512;

export const useAvatarUpload = () => {
  const toast = useToast();
  const generateUploadUrl = useMutation(api.profiles.generateAvatarUploadUrl);
  const setAvatar = useMutation(api.profiles.setAvatar);
  const removeAvatar = useMutation(api.profiles.removeAvatar);
  const [busy, setBusy] = useState(false);

  const run = async (work: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await work();
    } catch (err) {
      log.warn("avatar update failed", err);
      toast.show(errorMessage(err, "Couldn't update your photo. Check your connection."), "error");
    } finally {
      setBusy(false);
    }
  };

  const pick = async () => {
    // The system photo picker runs out of process, so no library permission is needed.
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    const asset = picked.canceled ? undefined : picked.assets[0];
    if (!asset) return;

    await run(async () => {
      // allowsEditing crops on iOS but isn't guaranteed square everywhere, so
      // resize the short side and let the circle mask the rest.
      const resize =
        (asset.width ?? 0) <= (asset.height ?? 0) ? { width: AVATAR_PX } : { height: AVATAR_PX };
      const image = await ImageManipulator.manipulate(asset.uri).resize(resize).renderAsync();
      // Bytes straight from base64 rather than fetch(file).blob(): React
      // Native's Blob round-trips through the native blob store, and posting
      // one with Expo's fetch fails.
      const saved = await image.saveAsync({
        compress: 0.8,
        format: SaveFormat.JPEG,
        base64: true,
      });
      if (!saved.base64) throw new Error("image manipulator returned no data");

      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: base64ToBytes(saved.base64),
      });
      if (!response.ok) throw new Error(`upload failed: ${response.status}`);
      const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };

      const problem = await setAvatar({ storageId });
      if (problem) toast.show(problem, "error");
      else toast.show("Photo updated.", "success");
    });
  };

  const remove = () => run(() => removeAvatar());

  return { pick, remove, busy };
};
