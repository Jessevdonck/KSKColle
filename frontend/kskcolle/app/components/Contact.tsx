import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mail, Phone, MapPin, User, MessageSquare, Send, Users, Calendar } from "lucide-react"

const Contact = () => {
  return (
    <section id="contact" className="bg-gradient-to-br from-neutral-50 to-neutral-100 py-20 scroll-m-11">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="bg-mainAccent/10 p-4 rounded-xl inline-flex mb-6">
            <Mail className="h-12 w-12 text-mainAccent" />
          </div>
          <h2 className="text-4xl font-bold text-textColor mb-4">Neem Contact Op</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Interesse in onze schaakclub? Stuur ons een bericht en we nemen zo snel mogelijk contact met je op!
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info Cards */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-neutral-200 hover:border-mainAccent/30 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-mainAccent/10 p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-mainAccent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-textColor">Email</h3>
                    <p className="text-gray-600">info@kskcolle.be</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Stuur ons een email voor algemene vragen of informatie over lidmaatschap.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-neutral-200 hover:border-mainAccent/30 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-mainAccent/10 p-3 rounded-lg">
                    <Phone className="h-6 w-6 text-mainAccent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-textColor">Telefoon</h3>
                    <p className="text-gray-600">+32 9 XXX XX XX</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Bel ons voor dringende vragen of meer informatie!</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-neutral-200 hover:border-mainAccent/30 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-mainAccent/10 p-3 rounded-lg">
                    <MapPin className="h-6 w-6 text-mainAccent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-textColor">Locatie</h3>
                    <p className="text-gray-600">Grote Markt 24, 9100 Sint-Niklaas</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Kom langs tijdens onze clubavonden elke donderdag vanaf 20:00 in de Graanmaat.</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-8 py-6">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <MessageSquare className="h-6 w-6" />
                    Stuur ons een bericht
                  </h3>
                  <p className="text-white/80 mt-2">Vul het formulier in en we nemen contact met je op</p>
                </div>

                <form className="p-8 space-y-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName" className="text-textColor font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Voornaam<span className="text-mainAccent">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        className="mt-2 border-neutral-300 focus:border-mainAccent focus:ring-mainAccent"
                        placeholder="Je voornaam"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-textColor font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Achternaam<span className="text-mainAccent">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        className="mt-2 border-neutral-300 focus:border-mainAccent focus:ring-mainAccent"
                        placeholder="Je achternaam"
                      />
                    </div>
                  </div>

                  {/* Contact Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="email" className="text-textColor font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        E-mail<span className="text-mainAccent">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="mt-2 border-neutral-300 focus:border-mainAccent focus:ring-mainAccent"
                        placeholder="je.email@voorbeeld.be"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber" className="text-textColor font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefoonnummer<span className="text-mainAccent">*</span>
                      </Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        required
                        className="mt-2 border-neutral-300 focus:border-mainAccent focus:ring-mainAccent"
                        placeholder="+32 9 XXX XX XX"
                      />
                    </div>
                  </div>

                  {/* Address Field */}
                  <div>
                    <Label htmlFor="address" className="text-textColor font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Adres<span className="text-mainAccent">*</span>
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      required
                      className="mt-2 border-neutral-300 focus:border-mainAccent focus:ring-mainAccent"
                      placeholder="Je volledige adres"
                    />
                  </div>

                  {/* Message Field */}
                  <div>
                    <Label htmlFor="description" className="text-textColor font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Bericht<span className="text-mainAccent">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      required
                      className="mt-2 border-neutral-300 focus:border-mainAccent focus:ring-mainAccent resize-none"
                      rows={5}
                      placeholder="Vertel ons waarmee we je verder kunnen helpen..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-center pt-4">
                    <Button
                      type="submit"
                      size="lg"
                      className="bg-mainAccent text-white hover:bg-mainAccentDark font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <Send className="h-5 w-5 mr-2" />
                      Verstuur Bericht
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact
