import { Reino } from "./reino.model";

export interface User {
  uid: string;
  email: string;
  username: string;
  reinos?: string[];
}
