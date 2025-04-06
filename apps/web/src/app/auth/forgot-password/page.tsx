import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  return (
    <form className='space-y-4'>
      <div className='space-y-1'>
        <Label htmlFor='email'>Email</Label>
        <Input
          id='email'
          type='email'
          name='email'
          placeholder='Type your email'
        />
      </div>
      <Button type='submit' className='w-full hover:cursor-pointer'>
        Recover password
      </Button>
      <Button
        variant='link'
        className='w-full hover:cursor-pointer'
        size='sm'
        asChild
      >
        <Link href='/auth/sign-in'>Sign in</Link>
      </Button>
    </form>
  )
}
