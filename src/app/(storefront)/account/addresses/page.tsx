import { getCustomerAddressesAction } from "@/lib/checkout/address-actions";
import AddressesClient from "@/components/account/AddressesClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Addresses",
  description: "Manage delivery addresses for faster checkout.",
  path: "/account/addresses",
  noIndex: true,
});

export default async function AccountAddressesPage() {
  const addresses = await getCustomerAddressesAction();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-green-900">Addresses</h1>
      <p className="mt-2 text-green-700">Manage delivery addresses for faster checkout.</p>
      <div className="mt-8">
        <AddressesClient initial={addresses} />
      </div>
    </div>
  );
}
