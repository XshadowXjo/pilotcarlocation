import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function PaymentResultPage() {
  const { result } = useParams<{ result: string }>()
  const isSuccess = result === 'succes'

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold uppercase tracking-wide">
          {isSuccess ? 'Paiement reçu ✓' : 'Paiement annulé'}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {isSuccess
            ? 'Merci ! Votre paiement a bien été pris en compte.'
            : "Aucun montant n'a été débité. Vous pouvez reprendre le paiement à tout moment depuis le lien reçu par e-mail."}
        </p>
        <Link to="/">
          <Button className="mt-6">Retour à l'accueil</Button>
        </Link>
      </div>
    </div>
  )
}