"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import Button from "@/components/Button";
import Login from "@/components/Login";
import Image from "@/components/Image";
import Field from "@/components/Field";

const formSchema = z
    .object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email"),
        password: z.string().min(1, "Password is required"),
        confirmPassword: z.string().min(1, "Confirm password is required"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type FormData = z.infer<typeof formSchema>;

const fields = [
    { name: "name", label: "Name", placeholder: "Enter your full name", type: "text" },
    { name: "email", label: "Email", placeholder: "Enter email", type: "email" },
    { name: "password", label: "Password", placeholder: "Enter password", type: "password" },
    { name: "confirmPassword", label: "Confirm Password", placeholder: "Confirm password", type: "password" },
] as const;

const SignUpView = () => {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    });

    const handleFieldChange = (field: keyof FormData, value: string) => {
        form.setValue(field, value);
        if (error) setError(null);
        if (form.formState.errors[field]) form.clearErrors(field);
    };

    const onSubmit = async (data: FormData) => {
        setError(null);
        setIsLoading(true);

        try {
            await authClient.signUp.email(
                { email: data.email, name: data.name, password: data.password },
                {
                    onSuccess: () => router.push("/"),
                    onError: (ctx) => {
                        setError(ctx.error.message || "Something went wrong. Please try again.");
                        setIsLoading(false);
                    },
                }
            );
        } catch {
            setError("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <Login title="Create your account" image="/images/login-pic-1.jpg">
            <Button className="w-full gap-2" isPrimary>
                <Image className="size-6 opacity-100" src="/images/google.svg" width={24} height={24} alt="Google" />
                Sign up with Google
            </Button>
            
            <div className="my-6 text-center text-label-sm text-tertiary">Or sign up with email</div>
            
            {error && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                    {error}
                </div>
            )}

            {fields.map((field, index) => (
                <Field
                    key={field.name}
                    className={index === fields.length - 1 ? "mb-6" : "mb-4"}
                    label={field.label}
                    placeholder={field.placeholder}
                    type={field.type}
                    value={form.watch(field.name)}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    required
                    error={form.formState.errors[field.name]?.message}
                />
            ))}

            <Button
                className="w-full !h-11"
                isSecondary
                onClick={form.handleSubmit(onSubmit)}
                disabled={isLoading}
            >
                {isLoading ? "Creating account..." : "Create account"}
            </Button>

            <div className="mt-4 text-center">
                <Link className="text-label-sm text-secondary transition-colors hover:text-primary" href="/sign-in">
                    Already have an account?
                </Link>
            </div>
        </Login>
    );
};

export default SignUpView;