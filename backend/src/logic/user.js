import * as userModel from "../models/userModel.js";

export const USER_ROLES = Object.freeze(["super_admin", "admin", "user"]);

export default class UserLogic {
  getAll() {
    return userModel.getUsers();
  }
}
