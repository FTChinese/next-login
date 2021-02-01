import {Stripe} from '@stripe/stripe-js';
import { Alert } from './alert';

interface PubKey {
  key: string;
}

interface CheckoutSession {
  id: string;
}

function getStripeBtn(domId: string): HTMLButtonElement {
  const elem = document.getElementById(domId);

  if (!elem) {
    throw new Error('Cannot find the specified element');
  }

  return elem as HTMLButtonElement;
}

function getAuthToken(elem: HTMLElement): string {
  
  const token = elem.getAttribute('data-stripe-jwt');

  if (!token) {
    throw new Error('Cannot find attribute for stripe jwt');
  }

  return token;
}

function initializeStripe(token: string): Promise<Stripe> {
  return fetch('/api/stripe/publishable-key', {
    headers: {
      Authorization: token
    }
  })
  .then(resp => {
    return resp.json()
  })
  .then((body: PubKey) => {
    return window.Stripe(body.key);
  });
}

function createSession(token: string): Promise<CheckoutSession> {
  return fetch('/api/stripe/checkout-session', {
    method: 'POST',
    headers: {
      Authorization: token,
    }
  })
  .then(resp => {
    return resp.json();
  });
}

class StripePay {

  private stripe: Stripe;

  initStripe(token: string): Promise<void> {
    if (this.stripe) {
      return Promise.resolve();
    }

   return initializeStripe(token)
    .then(stripe => {
      this.stripe = stripe;
      return;
    });
  }

  start(btnId: string) {

    const elem = getStripeBtn(btnId);

    const token = getAuthToken(elem);

    elem.addEventListener('click', () => {
      elem.disabled = true;
      
      this.initStripe(token)
        .then(() => {
          return createSession(token)
        })
        .then(sess => {
          console.log(sess);
          return this.stripe.redirectToCheckout({
            sessionId: sess.id,
          })
        })
        .then(result => {
          console.log(result);
          if (!result) {
            console.log('Redirected to stripe checkout page')
            return;
          }

          Alert.danger(result.error.message);
          elem.disabled = false;
        })
        .catch(err => {
          Alert.danger(err.message);
        });
    })
  }
}

(new StripePay()).start('stripe-pay');
