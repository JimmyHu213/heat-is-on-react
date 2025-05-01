import { AuthProvider } from "./AuthContext";
import { SettingProvider } from "./SettingsContext";

export default function Contexts(props) {
  return (
    <AuthProvider>
      <SettingProvider>{props.children}</SettingProvider>
    </AuthProvider>
  );
}
