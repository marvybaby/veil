import React from "react";
import LoginScreen from "./LoginScreen";
import MainScreen from "./MainScreen";
import { createLedgerContext } from "@daml/react";
import { Credentials } from "../Credentials";

export const userContext = createLedgerContext();
export const RoleContext = React.createContext<string>('');

const App: React.FC = () => {
  const [credentials, setCredentials] = React.useState<Credentials | undefined>(undefined);
  const [role, setRole] = React.useState<string>('');

  const handleLogin = (creds: Credentials, selectedRole: string) => {
    setCredentials(creds);
    setRole(selectedRole);
  };

  if (credentials) {
    return (
      <RoleContext.Provider value={role}>
        <userContext.DamlLedger
          token={credentials.token}
          party={credentials.party}
          user={credentials.user}>
          <MainScreen onLogout={() => { setCredentials(undefined); setRole(''); }} />
        </userContext.DamlLedger>
      </RoleContext.Provider>
    );
  } else {
    return <LoginScreen onLogin={handleLogin} />;
  }
};

export default App;