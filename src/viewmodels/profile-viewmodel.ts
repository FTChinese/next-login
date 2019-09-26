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

export type SavedKey = "saved" | "password_saved";

interface IFetchResult<T> {
    success?: T;
    notFound?: boolean;
    errMsg?: string;
}

interface IFormState<T> {
    values?: T;
    errors?: T;
}

interface IUpdateResult<T> {
    success?: boolean;
    errForm?: T;
    errApi?: IErrors;
}

interface UIProfile extends UIBase {
    profile?: Profile;
    address?: Address;
}

// `alert` is used to show a 404 error if API does not find current user.
interface UISingleInput extends UIBase {
    heading: string;
    input: ITextInput;
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

    private readonly msgSaved = "保存成功！";
    private readonly msgPwSaved = "密码修改成功";
    private readonly msgNotFound = "用户不存在或服务器错误！";

    private getDoneMsg(key: SavedKey): string {
        switch (key) {
            case "saved":
                return this.msgSaved;

            case "password_saved":
                return this.msgPwSaved;

            default:
                return "";
        }
    }

    async fetchProfile(ftcId: string): Promise<IFetchResult<Profile>> {
        try {
            const profile = await profileRepo.fetchProfile(ftcId);

            return {
                success: profile,
            }
        } catch (e) {
            switch (e.status) {
                case 404:
                    return {
                        notFound: true,
                    };

                default:
                    return {
                        errMsg: parseApiError(e).message,
                    };
            }
        }
    }

    async fetchAddress(ftcId: string): Promise<IFetchResult<Address>> {
        try {
            const address = await profileRepo.fetchAddress(ftcId);

            return {
                success: address,
            }
        } catch (e) {
            switch (e.status) {
                case 404:
                    return {
                        notFound: true,
                    };

                default:
                    return {
                        errMsg: parseApiError(e).message,
                    };
            }
        }
    }

    async buildProfileUI(account: Account, done?: SavedKey): Promise<UIProfile> {

        try {
            const [profile, address] = await Promise.all([
                profileRepo.fetchProfile(account.id),
                profileRepo.fetchAddress(account.id),
            ]);

            return {
                alert: done 
                    ? { message: this.getDoneMsg(done) }
                    : undefined,
                profile,
                address,
            };
        } catch (e) {
            switch (e.status) {
                case 404:
                    return {
                        errors: {
                            message: this.msgNotFound,
                        }
                    }

                default:
                    return {
                        errors: {
                            message: parseApiError(e).message,
                        }
                    }
            }
        }
    }

    /**
     * @description Update user name.
     */
    async validateName(data: INameFormData): Promise<IFormState<INameFormData>> {
        try {
            const result = await validate<INameFormData>(data, userNameSchema);

            return {
                values: result,
            }
        } catch (e) {
            const ex: ValidationError = e;

            return {
                errors: buildJoiErrors(ex.details) as INameFormData,
            };
        }
    }

    async updateName(account: Account, formData: INameFormData): Promise<IUpdateResult<INameFormData>> {
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
            const errBody = parseApiError(e);

            log("Error response: %O", errBody);

            if (errBody.error) {
                const o = errBody.error.toMap();

                log("Error message: %O", o);

                return {
                    errForm: {
                        userName: o.get("userName") || ""
                    }
                };
            }

            return {
                errApi: {
                    message: errBody.message,
                }
            }
        }
    }

    /**
     * @description Build the ui data for updating display name.
     * For GET, the `formData` and `result` should not
     * exist, thus we fetch user profile from API
     * and use the `Profile.userName` to set the form input value.
     */
    async buildNameUI(account: Account, formData?: INameFormData, result?: IUpdateResult<INameFormData>): Promise<UISingleInput> {

        if (formData) {
            formData.userName = formData.userName.trim();
        }

        const uiData: UISingleInput = {
            // Contains API error for PATCH request.
            errors: (result && result.errApi)
                ? result.errApi
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
                error: (result && result.errForm) 
                    ? result.errForm.userName 
                    : undefined,
            }
        };

        if (!formData) {
            const { success, notFound, errMsg: error } = await this.fetchProfile(account.id);

            if (!success) {
                // Contains API error for GET request.
                // If should mutually exclusive with `result.errApi`
                if (error) {
                    uiData.errors = {
                        message: error,
                    }
                }

                if (notFound) {
                    uiData.alert = {
                        message: this.msgNotFound,
                    }
                }

                return uiData;
            }

            uiData.input.value = success.userName;
        }

        return uiData;
    }

    /**
     * @description Update mobile
     */
    async validateMobile(data: IMobileFormData): Promise<IFormState<IMobileFormData>> {
        try {
            const result = await validate<IMobileFormData>(data, mobileSchema);

            return {
                values: result,
            }
        } catch (e) {
            const ex: ValidationError = e;

            return {
                errors: buildJoiErrors(ex.details) as IMobileFormData,
            };
        }
    }

    async updateMobile(account: Account, formData: IMobileFormData): Promise<IUpdateResult<IMobileFormData>> {
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
            const errBody = parseApiError(e);

            log("Error response: %O", errBody);

            if (errBody.error) {
                const o = errBody.error.toMap();

                log("Error message: %O", o);

                return {
                    errForm: {
                        mobile: o.get("mobile") || ""
                    }
                };
            }

            return {
                errApi: {
                    message: errBody.message,
                }
            }
        }
    }

    /**
     * @description Build the ui data for updating display name.
     * For GET, the `formData` and `result` should not
     * exist, thus we fetch user profile from API
     * and use the `Profile.userName` to set the form input value.
     */
    async buildMobileUI(account: Account, formData?: IMobileFormData, result?: IUpdateResult<IMobileFormData>): Promise<UISingleInput> {

        if (formData) {
            formData.mobile = formData.mobile.trim();
        }

        const uiData: UISingleInput = {
            // Contains API error for PATCH request.
            errors: (result && result.errApi)
                ? result.errApi
                : undefined,
            heading: "手机号码",
            input: {
                label: "",
                id: "mobile",
                type: "text",
                name: "profile[mobile]",
                value: formData ? formData.mobile : "",
                maxlength: "11",
                error: (result && result.errForm) 
                    ? result.errForm.mobile 
                    : undefined,
            }
        };

        if (!formData) {
            const { success, notFound, errMsg: error } = await this.fetchProfile(account.id);

            if (!success) {
                // Contains API error for GET request.
                // If should mutually exclusive with `result.errApi`
                if (error) {
                    uiData.errors = {
                        message: error,
                    }
                }

                if (notFound) {
                    uiData.alert = {
                        message: this.msgNotFound,
                    }
                }

                return uiData;
            }

            uiData.input.value = success.mobile;
        }

        return uiData;
    }

    async validateProfile(data: IProfileFormData): Promise<IFormState<IProfileFormData>> {
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

    async updateProfile(account: Account, formData: IProfileFormData): Promise<IUpdateResult<IProfileFormData>> {
        const { values, errors } = await this.validateProfile(formData);

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
            const errBody = parseApiError(e);

            log("Error response: %O", errBody);

            if (errBody.error) {
                const o = errBody.error.toMap();

                log("Error message: %O", o);

                return {
                    errForm: {
                        familyName: o.get("familyName") || "",
                        givenName: o.get("givenName") || "",
                        gender: o.get("gender") || "",
                        birhtday: o.get("birthday") || "",
                    },
                };
            }

            return {
                errApi: {
                    message: errBody.message,
                }
            }
        }
    }

    async buildInfoUI(account: Account, formData?: IProfileFormData, result?: IUpdateResult<IProfileFormData>): Promise<UIPersonalInfo> {
        if (!formData) {
            const { success, notFound, errMsg } = await this.fetchProfile(account.id)

            if (!success) {
                if (notFound) {
                    return {
                        alert: {
                            message: this.msgNotFound,
                        },
                    }
                }
                if (errMsg) {
                    return {
                        errors: {
                            message: errMsg,
                        }
                    }
                }

                return {
                    errors: {
                        message: "Unknow error occurred",
                    },
                };
            }

            formData = {
                familyName: success.familyName,
                givenName: success.givenName,
                gender: success.gender,
                birhtday: success.birthday,
            };
        }

        return {
            errors: (result && result.errApi)
                ? result.errApi
                : undefined,
            form: {
                nameInputs: [
                    {
                        label: "姓",
                        type: "text",
                        id: "familyName",
                        name: "profile[familyName]",
                        value: formData ? formData.familyName : "",
                        error: (result && result.errForm)
                            ? result.errForm.familyName
                            : undefined,
                    },
                    {
                        label: "名",
                        type: "text",
                        id: "givenName",
                        name: "profile[givenName]",
                        value: formData ? formData.familyName : "",
                        error: (result && result.errForm)
                            ? result.errForm.familyName
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
                    error: (result && result.errForm)
                        ? result.errForm.gender
                        : undefined,
                },
                birthdayInput: {
                    label: "生日",
                    id: "birthday",
                    type: "date",
                    name: "profile[birthday]",
                    value: formData ? formData.birhtday : undefined,
                    error: (result && result.errForm)
                        ? result.errForm.birhtday
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

    async updateAddress(account: Account, formData: IAddress): Promise<IUpdateResult<IAddress>> {
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
            const errBody = parseApiError(e);

            log("Error response: %O", errBody);

            if (errBody.error) {
                const o = errBody.error.toMap();

                log("Error message: %O", o);

                return {
                    errForm: {
                        country: o.get("country") || "",
                        province: o.get("province") || "",
                        city: o.get("city") || "",
                        district: o.get("district") || "",
                        street: o.get("street") || "",
                        postcode: o.get("postcode") || "",
                    },
                };
            }

            return {
                errApi: {
                    message: errBody.message,
                }
            }
        }
    }

    async buildAddressUI(account: Account, formData?: IAddress, result?: IUpdateResult<IAddress>): Promise<UIAddress> {
        if (!formData) {
            const { success, notFound, errMsg } = await this.fetchAddress(account.id)

            if (!success) {
                if (notFound) {
                    return {
                        alert: {
                            message: this.msgNotFound,
                        },
                    }
                }
                if (errMsg) {
                    return {
                        errors: {
                            message: errMsg,
                        }
                    }
                }

                return {
                    errors: {
                        message: "Unknow error occurred",
                    },
                };
            }

            formData = success;
        }

        return {
            errors: (result && result.errApi) ? result.errApi : undefined,
            formRows: [
                [
                    {
                        label: "国家",
                        type: "text",
                        id: "country",
                        name: "address[country]",
                        value: formData.country,
                        error: (result && result.errForm)
                            ? result.errForm.country
                            : undefined
                    }
                ],
                [
                    {
                        label: "省/直辖市",
                        type: "text",
                        id: "province",
                        name: "address[province]",
                        value: formData.province,
                        error: (result && result.errForm)
                            ? result.errForm.province
                            : undefined,
                        col: 4,
                    },
                    {
                        label: "市",
                        type: "text",
                        id: "city",
                        name: "address[city]",
                        value: formData.city,
                        error: (result && result.errForm)
                            ? result.errForm.city
                            : undefined,
                        col: 4,
                    },
                    {
                        label: "区/县",
                        type: "text",
                        id: "district",
                        name: "address[district]",
                        value: formData.district,
                        error: (result && result.errForm)
                            ? result.errForm.district
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
                        value: formData.street,
                        error: (result && result.errForm)
                            ? result.errForm.street
                            : undefined,
                        col: 10,
                    },
                    {
                        label: "邮编",
                        type: "text",
                        id: "postcode",
                        name: "address[postcode]",
                        value: formData.postcode,
                        error: (result && result.errForm)
                            ? result.errForm.postcode
                            : undefined,
                        col: 2,
                    },
                ],
            ],
        };
    }
}

export const profileViewModel = new ProfileViewModel();
