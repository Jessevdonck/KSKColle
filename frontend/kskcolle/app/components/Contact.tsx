import React from 'react'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Label } from "@/app/components/ui/label"

const ContactForm = () => {
  return (
    <section id="contact" className="bg-neutral-50 py-16 scroll-m-11">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-textColor mb-8 text-center">Neem Contact Op</h2>
        <form className="max-w-2xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="firstName" className="text-textColor">Voornaam<span className='text-mainAccent'>*</span></Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="mt-1 w-full border-mainAccent text-textColor"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="lastName" className="text-textColor">Achternaam<span className='text-mainAccent'>*</span></Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="mt-1 w-full border-mainAccent text-textColor"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="phoneNumber" className="text-textColor">E-mail<span className='text-mainAccent'>*</span></Label>
            <Input
              id="email"
              name="email"
              type="mail"
              required
              className="mt-1 w-full border-mainAccent text-textColor"
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber" className="text-textColor">Telefoonnummer<span className='text-mainAccent'>*</span></Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              required
              className="mt-1 w-full border-mainAccent text-textColor"
            />
          </div>
          <div>
            <Label htmlFor="address" className="text-textColor">Adres<span className='text-mainAccent'>*</span></Label>
            <Input
              id="address"
              name="address"
              type="text"
              required
              className="mt-1 w-full border-mainAccent text-textColor"
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-textColor">Omschrijving<span className='text-mainAccent'>*</span></Label>
            <Textarea
              id="description"
              name="description"
              required
              className="mt-1 w-full border-mainAccent text-textColor"
              rows={4}
            />
          </div>
          <div className="flex justify-center">
            <Button type="submit" className="bg-mainAccent text-neutral-50 hover:bg-mainAccentDark hover:text-white font-semibold">
              Verstuur
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default ContactForm