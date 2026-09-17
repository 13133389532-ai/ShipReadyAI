import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
export async function POST(req: Request) {
  const event = await req.json();
  console.log('payment user payload', event);
  if (event.type === 'checkout.session.completed') {
    // mark order paid
  }
  return Response.json({ok:true}, {headers:{'Access-Control-Allow-Origin':'*'}});
}
