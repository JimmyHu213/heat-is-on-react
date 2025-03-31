import { AuthProvider } from "./AuthContext";

export default function Contexts(props) {
  return <AuthProvider>{props.children}</AuthProvider>;
}
