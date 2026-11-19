import { Button } from '@inzpro/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@inzpro/ui/components/dialog'
import { Pencil } from 'lucide-react'
import { useState } from 'react'

import { ProfileNameForm } from './ProfileNameForm'

export const EditProfileNameDialog = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Zmień nazwę"
          />
        }
      >
        <Pencil />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zmień nazwę</DialogTitle>
          <DialogDescription>
            Pod tą nazwą widzą Cię inni użytkownicy w rankingach i na Twoim profilu.
          </DialogDescription>
        </DialogHeader>
        <ProfileNameForm onDone={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
