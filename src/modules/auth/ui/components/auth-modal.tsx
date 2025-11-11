"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import Button from "@/components/Button";
import Field from "@/components/Field";
import Image from "@/components/Image";

const signInSchema = z.object({
  email: z.string().email("الإيميل مش صحيح"),
  password: z.string().min(1, "الباسوورد مطلوب"),
});

const signUpSchema = z
  .object({
    name: z.string().min(1, "الإسم مطلوب"),
    email: z.string().email("الإيميل مش صحيح"),
    password: z.string().min(1, "الباسوورد مطلوب"),
    confirmPassword: z.string().min(1, "تأكيد الباسوورد مطلوب"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "الباسوورد ماتطابقش",
    path: ["confirmPassword"],
  });

type SignInData = z.infer<typeof signInSchema>;
type SignUpData = z.infer<typeof signUpSchema>;

interface AuthModalProps {
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

const AuthModal = ({ onClose, initialMode = "signin" }: AuthModalProps) => {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signInForm = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const form = mode === "signin" ? signInForm : signUpForm;

  const handleSignIn = async (data: SignInData) => {
    setError(null);
    setIsLoading(true);

    try {
      await authClient.signIn.email(
        { email: data.email, password: data.password },
        {
          onSuccess: () => {
            onClose();
            router.refresh();
          },
          onError: (ctx) => {
            setError(ctx.error.message || "الإيميل ولا الباسوورد غالطين.");
            setIsLoading(false);
          },
        }
      );
    } catch {
      setError("صار مشكل. حاول مرة أخرى.");
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpData) => {
    setError(null);
    setIsLoading(true);

    try {
      await authClient.signUp.email(
        { email: data.email, name: data.name, password: data.password },
        {
          onSuccess: () => {
            onClose();
            router.refresh();
          },
          onError: (ctx) => {
            setError(ctx.error.message || "صار مشكل. حاول مرة أخرى.");
            setIsLoading(false);
          },
        }
      );
    } catch {
      setError("صار مشكل. حاول مرة أخرى.");
      setIsLoading(false);
    }
  };

  const onSubmit = mode === "signin" 
    ? signInForm.handleSubmit(handleSignIn)
    : signUpForm.handleSubmit(handleSignUp);

  const switchMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
    signInForm.reset();
    signUpForm.reset();
  };

  return (
    <div className="p-8" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        {mode === "signin" ? "دخول للحساب متاعك" : "صنع حساب جديد"}
      </h2>

      <Button className="w-full gap-2 mb-4" isPrimary>
        <Image 
          className="size-6 opacity-100" 
          src="/images/google.svg" 
          width={24} 
          height={24} 
          alt="Google" 
        />
        {mode === "signin" ? "دخول بـ Google" : "تسجيل بـ Google"}
      </Button>

      <div className="my-6 text-center text-sm text-gray-500">
        ولا {mode === "signin" ? "دخول" : "تسجيل"} بالإيميل
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {mode === "signin" ? (
        <>
          <Field
            className="mb-4"
            label="الإيميل"
            placeholder="اكتب الإيميل متاعك"
            type="email"
            value={signInForm.watch("email")}
            onChange={(e) => {
              signInForm.setValue("email", e.target.value);
              if (error) setError(null);
              if (signInForm.formState.errors.email) signInForm.clearErrors("email");
            }}
            required
            error={signInForm.formState.errors.email?.message}
          />
          <Field
            className="mb-6"
            label="الباسوورد"
            placeholder="اكتب الباسوورد متاعك"
            type="password"
            value={signInForm.watch("password")}
            onChange={(e) => {
              signInForm.setValue("password", e.target.value);
              if (error) setError(null);
              if (signInForm.formState.errors.password) signInForm.clearErrors("password");
            }}
            required
            error={signInForm.formState.errors.password?.message}
            forgotPassword
          />
        </>
      ) : (
        <>
          <Field
            className="mb-4"
            label="الإسم"
            placeholder="اكتب اسمك الكامل"
            type="text"
            value={signUpForm.watch("name")}
            onChange={(e) => {
              signUpForm.setValue("name", e.target.value);
              if (error) setError(null);
              if (signUpForm.formState.errors.name) signUpForm.clearErrors("name");
            }}
            required
            error={signUpForm.formState.errors.name?.message}
          />
          <Field
            className="mb-4"
            label="الإيميل"
            placeholder="اكتب الإيميل متاعك"
            type="email"
            value={signUpForm.watch("email")}
            onChange={(e) => {
              signUpForm.setValue("email", e.target.value);
              if (error) setError(null);
              if (signUpForm.formState.errors.email) signUpForm.clearErrors("email");
            }}
            required
            error={signUpForm.formState.errors.email?.message}
          />
          <Field
            className="mb-4"
            label="الباسوورد"
            placeholder="اكتب الباسوورد"
            type="password"
            value={signUpForm.watch("password")}
            onChange={(e) => {
              signUpForm.setValue("password", e.target.value);
              if (error) setError(null);
              if (signUpForm.formState.errors.password) signUpForm.clearErrors("password");
            }}
            required
            error={signUpForm.formState.errors.password?.message}
          />
          <Field
            className="mb-6"
            label="تأكيد الباسوورد"
            placeholder="أكّد الباسوورد"
            type="password"
            value={signUpForm.watch("confirmPassword")}
            onChange={(e) => {
              signUpForm.setValue("confirmPassword", e.target.value);
              if (error) setError(null);
              if (signUpForm.formState.errors.confirmPassword) signUpForm.clearErrors("confirmPassword");
            }}
            required
            error={signUpForm.formState.errors.confirmPassword?.message}
          />
        </>
      )}

      <Button
        className="w-full !h-11"
        isSecondary
        onClick={onSubmit}
        disabled={isLoading}
      >
        {isLoading 
          ? (mode === "signin" ? "جاري الدخول..." : "جاري التسجيل...") 
          : (mode === "signin" ? "دخول" : "تسجيل")
        }
      </Button>

      <div className="mt-4 text-center">
        <button
          onClick={switchMode}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          {mode === "signin" ? "ماعندكش حساب؟" : "عندك حساب ديجا؟"}
        </button>
      </div>
    </div>
  );
};

export default AuthModal;

