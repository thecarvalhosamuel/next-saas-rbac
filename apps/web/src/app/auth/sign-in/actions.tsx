'use server'

import { signInWithPassword } from '@/http/sign-in-with-password'

export async function signInwithEmailAndPassword(formData: FormData) {
  const { email, password } = Object.fromEntries(formData)

  const response = await signInWithPassword({
    email: email as string,
    password: password as string,
  })

  console.log(response)
}
