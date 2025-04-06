import Image from 'next/image'
import Link from 'next/link'

import GithubIcon from '@/assets/github-icon.svg'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export default function SignUpPage() {
  return (
    <form className='space-y-4'>
      <div className='space-y-1'>
        <Label htmlFor='name'>Name</Label>
        <Input id='name' type='text' name='name' placeholder='Type your name' />
      </div>
      <div className='space-y-1'>
        <Label htmlFor='email'>Email</Label>
        <Input
          id='email'
          type='email'
          name='email'
          placeholder='Type your email'
        />
      </div>
      <div className='space-y-1'>
        <Label htmlFor='password'>Password</Label>
        <Input
          id='password'
          type='password'
          name='password'
          placeholder='Type your password'
        />
      </div>
      <div className='space-y-1'>
        <Label htmlFor='confirmPassword'>Confirm Password</Label>
        <Input
          id='confirmPassword'
          type='password'
          name='confirmPassword'
          placeholder='Type your password'
        />
      </div>
      <Button type='submit' className='w-full hover:cursor-pointer'>
        Create account
      </Button>
      <Button
        variant='link'
        className='w-full hover:cursor-pointer'
        size='sm'
        asChild
      >
        <Link href='/auth/sign-in'>Already have an account? Sign in</Link>
      </Button>
      <Separator />
      <Button
        type='submit'
        variant='outline'
        className='w-full hover:cursor-pointer'
      >
        <Image
          src={GithubIcon}
          alt='Github'
          width={16}
          height={16}
          className='mr-2 size-4 dark:invert'
        />
        Sign up with Github
      </Button>
    </form>
  )
}
