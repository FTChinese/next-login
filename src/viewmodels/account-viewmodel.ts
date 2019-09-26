import {
    validate,
    ValidationError,
} from "@hapi/joi";
import debug from "debug";
import {
    UIBase, 
    IErrors,
    ITextInput,
    IRadio,
} from "./ui";
import {
    parseApiError,
} from "./api-error";
import {
    userNameSchema,
    mobileSchema,
    profileSchema,
    addressSchema,
    buildJoiErrors,
} from "./validator";
import {
    Account,
    Profile,
    IProfileFormData,
    Address,
    INameFormData,
    IMobileFormData,
    IAddress,
} from "../models/reader";

import {
    profileRepo,
} from "../repository/profile";

const log = debug("user:profile-viewmodel");

class AccountViewModel {
    
}
