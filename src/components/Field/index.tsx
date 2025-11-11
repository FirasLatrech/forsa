import Link from "next/link";
import Icon from "@/components/Icon";

type FieldProps = {
    className?: string;
    classInput?: string;
    label?: string;
    children?: React.ReactNode;
    textarea?: boolean;
    type?: string;
    validated?: boolean;
    forgotPassword?: boolean;
    error?: string;
};

const Field = ({
    className,
    classInput,
    label,
    children,
    textarea,
    type,
    validated,
    forgotPassword,
    error,
    ...inputProps
}: FieldProps &
    React.InputHTMLAttributes<HTMLInputElement> &
    React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
    return (
        <div className={`${className || ""}`} style={{ fontFamily: 'Cairo, sans-serif' }}>
            {label && (
                <div className="flex items-center mb-2" dir="rtl">
                    <div className="ml-auto">{label}</div>
                    {forgotPassword && (
                        <Link
                            className="text-label-sm font-arabic text-secondary transition-colors hover:text-primary"
                            href="/reset-password"
                        >
                            نسيت الباسوورد؟
                        </Link>
                    )}
                </div>
            )}
            <div className={`relative ${textarea ? "text-0" : ""}`}>
                {children}
                {textarea ? (
                    <textarea
                        className={`w-full h-20 px-5.5 py-4 border-[1.5px] border-s-01 rounded-xl text-label-lg text-primary transition-colors resize-none outline-0 focus:border-s-02 ${
                            validated ? "pr-10" : ""
                        }  ${classInput || ""}`}
                        style={{ fontFamily: 'Cairo, sans-serif' }}
                        dir="rtl"
                        {...inputProps}
                    ></textarea>
                ) : (
                    <input
                        className={`w-full h-12 px-5.5 border-[1.5px] border-s-01 rounded-xl text-label-lg text-primary transition-colors outline-0 focus:border-s-02 ${
                            validated ? "pr-10" : ""
                        } ${classInput || ""}`}
                        type={type || "text"}
                        style={{ fontFamily: 'Cairo, sans-serif' }}
                        dir="rtl"
                        {...inputProps}
                    />
                )}
                {validated && (
                    <Icon
                        className="absolute top-1/2 right-3.5 -translate-y-1/2 fill-secondary"
                        name="check-circle"
                    />
                )}
            </div>
            {error && <div className="mt-2 text-label-sm text-red font-arabic" dir="rtl">
                {error}
            </div>}
        </div>
    );
};

export default Field;
