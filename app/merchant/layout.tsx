import { MerchantShell } from "@/components/shell/app-shells";

export default function MerchantLayout({ children }: LayoutProps<"/merchant">) {
  return <MerchantShell>{children}</MerchantShell>;
}
