import { TransactionFragment } from "@app/graphql/generated";
import { useI18nContext } from "@app/i18n/i18n-react";

// This should extend the Transaction directly from the cache

export const useDescriptionDisplay = ({
  tx, bankName,
}: {
  tx: TransactionFragment | undefined;
  bankName: string;
}) => {
  const { LL } = useI18nContext();

  if (!tx) {
    return "";
  }

  const { memo, direction, settlementVia } = tx;
  if (memo) {
    return memo;
  }

  const isReceive = direction === "RECEIVE";

  switch (settlementVia.__typename) {
    case "SettlementViaOnChain":
      return "OnChain Payment";
    case "SettlementViaLn":
      return "Invoice";
    case "SettlementViaIntraLedger":
      return isReceive
        ? `${LL.common.from()} ${settlementVia.counterPartyUsername || bankName + " User"}`
        : `${LL.common.to()} ${settlementVia.counterPartyUsername || bankName + " User"}`;
  }
};
