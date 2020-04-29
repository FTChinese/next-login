import {
    validate,
    ValidationError,
} from "@hapi/joi";
import debug from "debug";
import {
    UIBase, 
    ITextInput,
    IRadio,
    UISingleInput,
} from "./ui";
import {
    KeyUpdated, getMsgUpdated,
} from "./redirection"
import {
    APIError, 
    IFetchResult,
} from "./api-response";
import {
    userNameSchema,
    mobileSchema,
    profileSchema,
    addressSchema,
    buildJoiErrors,
    IFormState,
} from "../pages/validator";
import {
    Account,
    Profile,
    IProfileFormData,
    Address,
    IName,
    IMobile,
    IAddress,
} from "../models/reader";

import {
    profileRepo,
} from "../repository/profile";

const log = debug("user:profile-viewmodel");

interface UIProfile extends UIBase {
    profile?: Profile;
    address?: Address;
}

interface IUpdateNameResult extends IFetchResult<boolean> {
    errForm?: IName;
}

interface IUpdateMobileResult extends IFetchResult<boolean> {
    errForm?: IMobile;
}

interface IUpdateInfoResult extends IFetchResult<boolean> {
    errForm?: IProfileFormData;
}

interface IUpdateAddressResult extends IFetchResult<boolean> {
    errForm?: IAddress;
}

interface UIPersonalInfo extends UIBase {
    form?: {
        nameInputs: Array<ITextInput>;
        genderRadio: IRadio;
        birthdayInput: ITextInput;
    }
}

interface IFormGroup extends ITextInput {
    col?: number;
}

interface UIAddress extends UIBase {
    formRows?: Array<Array<IFormGroup>>;
}

class ProfileViewModel {

    async fetchProfile(account: Account): Promise<IFetchResult<Profile>> {
        try {
            const profile = await profileRepo.fetchProfile(account.id);

            return {
                success: profile,
            };
        } catch (e) {
            return {
                errResp: new APIError(e),
            };
        }
    }

    async fetchAddress(account: Account): Promise<IFetchResult<Address>> {
        try {
            const addr = await profileRepo.fetchAddress(account.id);

            return {
                success: addr,
            };
        } catch (e) {
            return {
                errResp: new APIError(e),
            }
        }
    }

    async buildProfileUI(account: Account, done?: KeyUpdated): Promise<UIProfile> {

        const [profile, address] = await Promise.all([
            profileRepo.fetchProfile(account.id),
            profileRepo.fetchAddress(account.id),
        ]);

        return {
            alert: done 
                ? { message: getMsgUpdated(done) }
                : undefined,
            profile,
            address,
        };
    }

    /**
     * @description Update user name.
     */
    async validateName(data: IName): Promise<IFormState<IName>> {
        try {
            const result = await validate<IName>(data, userNameSchema);

            return {
                values: result,
            }
        } catch (e) {
            const ex: ValidationError = e;

            return {
                errors: buildJoiErrors(ex.details) as IName,
            };
        }
    }

    async updateName(account: Account, formData: IName): Promise<IUpdateNameResult> {
        const { values, errors } = await this.validateName(formData);

        if (errors) {
            return {
                errForm: errors,
            }
        }

        if (!values) {
            throw new Error("invalid form data to update display name");
        }

        try {
            const ok = await profileRepo.updateName(
                account.id,
                values,
            );

            return {
                success: ok,
            };
        } catch (e) {
            const errResp = new APIError(e);

            if (errResp.error) {
                const o = errResp.error.toMap();

                log("Error message: %O", o);

                return {
                    errForm: {
                        userName: o.get(errResp.error.field) || ""
                    }
                };
            }

            return {
                errResp,
            }
        }
    }

    /**
     * @description Build the ui data for updating display name.
     * For GET, the `formData` and `result` should not
     * exist, thus we fetch user profile from API
     * and use the `Profile.userName` to set the form input value.
     */
    buildNameUI(
        formData?: IName, 
        result?: IUpdateNameResult,
    ): UISingleInput {

        if (formData) {
            formData.userName = formData.userName.trim();
        }

        // if (!formData) {
        //     const success = await profileRepo.fetchProfile(account.id);

        //     formData = {
        //         userName: success.userName || "",
        //     };
        // }

        const { errForm, errResp } = result || {};
        return {
            // Contains API error for PATCH request.
            errors: errResp
                ? { message: errResp.message }
                : undefined,
            heading: "用户名",
            input: {
                label: "",
                id: "name",
                type: "text",
                name: "profile[userName]",
                value: formData ? formData.userName : "",
                maxlength: "64",
                desc: "20字符以内",
                error: errForm 
                    ? errForm.userName 
                    : undefined,
            }
        };
    }

    /**
     * @description Update mobile
     */
    async validateMobile(data: IMobile): Promise<IFormState<IMobile>> {
        try {
            const result = await validate<IMobile>(data, mobileSchema);

            return {
                values: result,
            }
        } catch (e) {
            const ex: ValidationError = e;

            return {
                errors: buildJoiErrors(ex.details) as IMobile,
            };
        }
    }

    async updateMobile(account: Account, formData: IMobile): Promise<IUpdateMobileResult> {
        const { values, errors } = await this.validateMobile(formData);

        if (errors) {
            return {
                errForm: errors,
            }
        }

        if (!values) {
            throw new Error("invalid form data to update display name");
        }

        try {
            const ok = await profileRepo.updateMobile(
                account.id,
                values,
            );

            return {
                success: ok,
            };
        } catch (e) {
            const errResp = new APIError(e);

            if (errResp.error) {
                const o = errResp.error.toMap();

                return {
                    errForm: {
                        mobile: o.get(errResp.error.field) || ""
                    }
                };
            }

            return {
                errResp,
            }
        }
    }

    /**
     * @description Build the ui data for updating display name.
     * For GET, the `formData` and `result` should not
     * exist, thus we fetch user profile from API
     * and use the `Profile.userName` to set the form input value.
     */
    buildMobileUI(formData?: IMobile, result?: IUpdateMobileResult): UISingleInput {

        if (formData) {
            formData.mobile = formData.mobile.trim();
        }

        const { errForm, errResp } = result || {};
        const uiData: UISingleInput = {
            // Contains API error for PATCH request.
            errors: errResp
                ? { message: errResp.message}
                : undefined,
            heading: "手机号码",
            input: {
                label: "",
                id: "mobile",
                type: "text",
                name: "profile[mobile]",
                value: formData ? formData.mobile : "",
                maxlength: "11",
                error: errForm 
                    ? errForm.mobile 
                    : undefined,
            }
        };

        return uiData;
    }

    async validateInfo(data: IProfileFormData): Promise<IFormState<IProfileFormData>> {
        try {
            const result = await validate<IProfileFormData>(data, profileSchema);

            return {
                values: result,
            }
        } catch (e) {
            const ex: ValidationError = e;

            return {
                errors: buildJoiErrors(ex.details) as IProfileFormData,
            };
        }
    }

    async updateInfo(account: Account, formData: IProfileFormData): Promise<IUpdateInfoResult> {
        const { values, errors } = await this.validateInfo(formData);

        if (errors) {
            return {
                errForm: errors,
            }
        }

        if (!values) {
            throw new Error("invalid form data to update display name");
        }

        try {
            const ok = await profileRepo.updateProfile(
                account.id,
                values,
            );

            return {
                success: ok,
            };
        } catch (e) {
            const errResp = new APIError(e);

            if (errResp.error) {
                const o = errResp.error.toMap();

                return {
                    errForm: {
                        familyName: o.get(errResp.error.field) || "",
                        givenName: o.get(errResp.error.field) || "",
                        gender: o.get(errResp.error.field) || "",
                        birhtday: o.get(errResp.error.field) || "",
                    },
                };
            }

            return {
                errResp,
            }
        }
    }

    buildInfoUI(
        formData?: IProfileFormData, 
        result?: IUpdateInfoResult,
    ): UIPersonalInfo {

        const { errForm, errResp } = result || {};
        return {
            errors: errResp
                ? { message: errResp.message }
                : undefined,
            form: {
                nameInputs: [
                    {
                        label: "姓",
                        type: "text",
                        id: "familyName",
                        name: "profile[familyName]",
                        value: formData ? formData.familyName : "",
                        error: errForm
                            ? errForm.familyName
                            : undefined,
                    },
                    {
                        label: "名",
                        type: "text",
                        id: "givenName",
                        name: "profile[givenName]",
                        value: formData ? formData.familyName : "",
                        error: errForm
                            ? errForm.familyName
                            : undefined,
                    }
                ],
                genderRadio: {
                    title: "性别",
                    name: "profile[gender]",
                    inputs: [
                        {
                            label: "男",
                            id: "genderM",
                            value: "M",
                            checked: formData 
                                ? formData.gender == "M" 
                                : false,
                        },
                        {
                            label: "女",
                            id: "genderF",
                            value: "F",
                            checked: formData 
                                ? formData.gender == "F" 
                                : false,
                        }
                    ],
                    error: errForm
                        ? errForm.gender
                        : undefined,
                },
                birthdayInput: {
                    label: "生日",
                    id: "birthday",
                    type: "date",
                    name: "profile[birthday]",
                    value: formData ? formData.birhtday : undefined,
                    error: errForm
                        ? errForm.birhtday
                        : undefined,
                },    
            },
        };
    }

    async validateAddress(data: IAddress): Promise<IFormState<IAddress>> {
        try {
            const result = await validate<IAddress>(data, addressSchema);

            return {
                values: result,
            }
        } catch (e) {
            const ex: ValidationError = e;

            return {
                errors: buildJoiErrors(ex.details) as IAddress,
            };
        }
    }

    async updateAddress(account: Account, formData: IAddress): Promise<IUpdateAddressResult> {
        const { values, errors } = await this.validateAddress(formData);

        if (errors) {
            return {
                errForm: errors,
            }
        }

        if (!values) {
            throw new Error("invalid form data to update address");
        }

        try {
            const ok = await profileRepo.updateAddress(
                account.id,
                values,
            );

            return {
                success: ok,
            };
        } catch (e) {
            const errResp = new APIError(e);

            if (errResp.error) {
                const o = errResp.error.toMap();

                return {
                    errForm: {
                        country: o.get(errResp.error.field) || "",
                        province: o.get(errResp.error.field) || "",
                        city: o.get(errResp.error.field) || "",
                        district: o.get(errResp.error.field) || "",
                        street: o.get(errResp.error.field) || "",
                        postcode: o.get(errResp.error.field) || "",
                    },
                };
            }

            return {
                errResp,
            }
        }
    }

    buildAddressUI(formData?: IAddress, result?: IUpdateAddressResult): UIAddress {

        const { errForm, errResp } = result || {};
        return {
            errors: errResp ? {
                message: errResp.message,
            } : undefined,
            formRows: [
                [
                    {
                        label: "国家",
                        type: "text",
                        id: "country",
                        name: "address[country]",
                        value: formData ? formData.country : "",
                        error: errForm
                            ? errForm.country
                            : undefined
                    }
                ],
                [
                    {
                        label: "省/直辖市",
                        type: "text",
                        id: "province",
                        name: "address[province]",
                        value: formData ? formData.province : "",
                        error: errForm
                            ? errForm.province
                            : undefined,
                        col: 4,
                    },
                    {
                        label: "市",
                        type: "text",
                        id: "city",
                        name: "address[city]",
                        value: formData ? formData.city : "",
                        error: errForm
                            ? errForm.city
                            : undefined,
                        col: 4,
                    },
                    {
                        label: "区/县",
                        type: "text",
                        id: "district",
                        name: "address[district]",
                        value: formData ? formData.district : "",
                        error: errForm
                            ? errForm.district
                            : undefined,
                        col: 4,
                    }
                ],
                [
                    {
                        label: "街道",
                        type: "text",
                        id: "street",
                        name: "address[street]",
                        value: formData ? formData.street : "",
                        error: errForm
                            ? errForm.street
                            : undefined,
                        col: 10,
                    },
                    {
                        label: "邮编",
                        type: "text",
                        id: "postcode",
                        name: "address[postcode]",
                        value: formData ? formData.postcode : "",
                        error: errForm
                            ? errForm.postcode
                            : undefined,
                        col: 2,
                    },
                ],
            ],
        };
    }
}

export const profileViewModel = new ProfileViewModel();
