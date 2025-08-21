import CheckoutForm from '@/components/CheckoutForm';

export default function CheckoutPage({ searchParams }: { searchParams: { offerId?: string } }) {
  const offerId = searchParams.offerId;
  if (!offerId) return <main>Missing offerId</main>;
  return (
    <main>
      <CheckoutForm offerId={offerId} />
    </main>
  );
}

