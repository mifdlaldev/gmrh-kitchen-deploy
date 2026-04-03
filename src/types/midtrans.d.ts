type MidtransSnapResult = {
  order_id?: string;
  transaction_status?: string;
  payment_type?: string;
  gross_amount?: string;
  status_code?: string;
  status_message?: string;
};

type MidtransSnapCallbacks = {
  onSuccess?: (result: MidtransSnapResult) => void;
  onPending?: (result: MidtransSnapResult) => void;
  onError?: (result: MidtransSnapResult) => void;
  onClose?: () => void;
};

type MidtransSnap = {
  pay: (token: string, callbacks?: MidtransSnapCallbacks) => void;
};

declare global {
  interface Window {
    snap: MidtransSnap;
  }
}

export {};
