import { useAuthActions } from "@convex-dev/auth/react";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ErrorBanner, Field, PrimaryButton } from "../../components/ui";
import { useStyles } from "./styles";

type Flow = "signIn" | "signUp";

// Convex Auth's Password provider rejects anything shorter.
const PASSWORD_MIN = 8;

const FAILURE: Record<Flow, string> = {
  signIn: "That email and password don't match an account.",
  signUp: "Couldn't create that account. The email may already be registered.",
};

export const SignInForm: React.FC = () => {
  const styles = useStyles();
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<Flow>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    // Convex Auth matches emails exactly, so "Ben@…" from autofill would miss
    // an account created as "ben@…".
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.includes("@")) return setError("Enter your email address.");
    if (flow === "signUp" && password.length < PASSWORD_MIN) {
      return setError(`Passwords need at least ${PASSWORD_MIN} characters.`);
    }

    setBusy(true);
    setError(null);
    try {
      await signIn("password", { email: trimmedEmail, password, flow });
    } catch {
      setError(FAILURE[flow]);
      setBusy(false);
    }
    // On success the screen swaps to the next step, unmounting this form.
  };

  const toggleFlow = () => {
    setFlow((f) => (f === "signIn" ? "signUp" : "signIn"));
    setError(null);
  };

  return (
    <View style={styles.form}>
      <Text style={styles.intro}>
        {flow === "signIn"
          ? "Sign in to follow friends and see who else is out seeking."
          : "Create an account to follow friends. Your email stays private: others only see your username."}
      </Text>

      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={flow === "signIn" ? "current-password" : "new-password"}
        textContentType={flow === "signIn" ? "password" : "newPassword"}
        hint={flow === "signUp" ? `At least ${PASSWORD_MIN} characters.` : undefined}
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      {error != null && <ErrorBanner message={error} />}

      <PrimaryButton
        title={flow === "signIn" ? "Sign in" : "Create account"}
        onPress={submit}
        busy={busy}
      />

      <Pressable style={styles.switchFlow} onPress={toggleFlow} accessibilityRole="button">
        <Text style={styles.switchFlowText}>
          {flow === "signIn" ? "New here? Create an account" : "Have an account? Sign in"}
        </Text>
      </Pressable>
    </View>
  );
};
