import React from "react";
import LoginScreen from "./LoginScreen";
import MainScreen from "./MainScreen";
import { createLedgerContext } from "@daml/react";
import { Credentials } from "../Credentials";

export const userContext = createLedgerContext();

const App: React.FC = () => {
  const [credentials, setCredentials] = React.useState<Credentials | undefined>(undefined);

  if (credentials) {
    return (
      <userContext.DamlLedger
        token={credentials.token}
        party={credentials.party}
        user={credentials.user}>
        <MainScreen onLogout={() => setCredentials(undefined)} />
      </userContext.DamlLedger>
    );
  } else {
    return <LoginScreen onLogin={setCredentials} />;
  }
};

export default App;