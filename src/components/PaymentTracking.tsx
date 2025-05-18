import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store';
import { format } from 'date-fns';

interface Payment {
  id: string;
  from: string;
  to: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed';
  description?: string;
}

interface PaymentTrackingProps {
  groupId: string;
  onPaymentAdd: (payment: Omit<Payment, 'id' | 'date'>) => void;
}

export default function PaymentTracking({ groupId, onPaymentAdd }: PaymentTrackingProps) {
  const { user } = useAuthStore();
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [newPayment, setNewPayment] = useState({
    to: '',
    amount: '',
    description: '',
  });

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payment: Omit<Payment, 'id' | 'date'> = {
      from: user.name,
      to: newPayment.to,
      amount: parseFloat(newPayment.amount),
      status: 'pending',
      description: newPayment.description,
    };

    onPaymentAdd(payment);
    setPayments([...payments, {
      ...payment,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    }]);
    setIsAddPaymentModalOpen(false);
    setNewPayment({ to: '', amount: '', description: '' });
  };

  const handleMarkAsCompleted = (paymentId: string) => {
    setPayments(payments.map(payment => 
      payment.id === paymentId 
        ? { ...payment, status: 'completed' }
        : payment
    ));
  };

  return (
    <div className="card">
      <div className="px-4 py-5 sm:px-6 gradient-bg rounded-t-lg flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">
          Payment Tracking
        </h2>
        <button
          onClick={() => setIsAddPaymentModalOpen(true)}
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Payment
        </button>
      </div>
      <div className="border-t border-gray-100">
        {payments.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No payments tracked yet
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {payments.map((payment) => (
              <li key={payment.id} className="px-4 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {payment.from} → {payment.to}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(payment.date), 'MMM d, yyyy')}
                    </p>
                    {payment.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {payment.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary-600">
                      ${payment.amount.toFixed(2)}
                    </p>
                    <button
                      onClick={() => handleMarkAsCompleted(payment.id)}
                      className={`mt-1 text-sm ${
                        payment.status === 'completed'
                          ? 'text-green-600'
                          : 'text-yellow-600 hover:text-yellow-700'
                      }`}
                    >
                      {payment.status === 'completed' ? 'Completed' : 'Mark as Completed'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Transition appear show={isAddPaymentModalOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsAddPaymentModalOpen(false)}
        >
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <div className="flex justify-between items-center mb-4">
                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                      Add Payment
                    </Dialog.Title>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500"
                      onClick={() => setIsAddPaymentModalOpen(false)}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <form onSubmit={handleAddPayment} className="space-y-4">
                    <div>
                      <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                        Paid to
                      </label>
                      <input
                        type="text"
                        id="to"
                        className="input mt-1"
                        value={newPayment.to}
                        onChange={(e) => setNewPayment({ ...newPayment, to: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                        Amount
                      </label>
                      <input
                        type="number"
                        id="amount"
                        className="input mt-1"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        className="input mt-1"
                        value={newPayment.description}
                        onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="mt-6">
                      <button type="submit" className="btn btn-primary w-full">
                        Add Payment
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
} 