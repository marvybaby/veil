import { User } from "@daml/ledger";

export type Credentials = {
  party: string;
  token: string;
  user: User;
};

export default Credentials;