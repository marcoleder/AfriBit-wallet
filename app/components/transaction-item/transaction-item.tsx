import React from "react"
import { View } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"

// eslint-disable-next-line camelcase
import { useFragment } from "@apollo/client"
import {
  TransactionFragment,
  TransactionFragmentDoc,
  WalletCurrency,
} from "@app/graphql/generated"
import { useDisplayCurrency } from "@app/hooks/use-display-currency"
import { RootStackParamList } from "@app/navigation/stack-param-lists"
import { testProps } from "@app/utils/testProps"
import { useNavigation } from "@react-navigation/native"
import { StackNavigationProp } from "@react-navigation/stack"

import { useAppConfig } from "@app/hooks"
import { toWalletAmount } from "@app/types/amounts"
import { Text, makeStyles, ListItem } from "@rneui/themed"
import HideableArea from "../hideable-area/hideable-area"
import { IconTransaction } from "../icon-transactions"
import { TransactionDate } from "../transaction-date"
import { useI18nContext } from "@app/i18n/i18n-react"
import { useDescriptionDisplay } from "./useDescriptionDisplay"

type Props = {
  txid: string
  subtitle?: boolean
  isFirst?: boolean
  isLast?: boolean
  isOnHomeScreen?: boolean
  isBalanceHidden?: boolean
}

type DummyProps = {
  isBalanceHidden?: boolean
}

export const TransactionItem: React.FC<Props> = ({
  txid,
  subtitle = false,
  isFirst = false,
  isLast = false,
  isOnHomeScreen = false,
  isBalanceHidden = false,
}) => {
  const styles = useStyles({
    isFirst,
    isLast,
    isOnHomeScreen,
  })

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const { data: tx } = useFragment<TransactionFragment>({
    fragment: TransactionFragmentDoc,
    fragmentName: "Transaction",
    from: {
      __typename: "Transaction",
      id: txid,
    },
  })

  const {
    appConfig: { galoyInstance },
  } = useAppConfig()
  const { formatMoneyAmount, formatCurrency } = useDisplayCurrency()

  const description = useDescriptionDisplay({
    tx,
    bankName: galoyInstance.name,
  })

  if (!tx || Object.keys(tx).length === 0) {
    return null
  }

  const walletCurrency = tx.settlementCurrency as WalletCurrency

  const AmountDisplayStyle = ({
    isReceive,
    isPending,
  }: {
    isReceive: boolean
    isPending: boolean
  }) => {
    const styles = useStyles()

    if (isPending) {
      return styles.pending
    }

    if (walletCurrency === WalletCurrency.Btc) {
      return isReceive ? styles.receiveBtc : styles.send
    } else if (walletCurrency === WalletCurrency.Usd) {
      return isReceive ? styles.receiveUsd : styles.send
    }

    return isReceive ? styles.receive : styles.send
  }

  const isReceive = tx.direction === "RECEIVE"
  const isPending = tx.status === "PENDING"

  const formattedSettlementAmount = formatMoneyAmount({
    moneyAmount: toWalletAmount({
      amount: tx.settlementAmount,
      currency: tx.settlementCurrency,
    }),
  })

  const formattedDisplayAmount = formatCurrency({
    amountInMajorUnits: tx.settlementDisplayAmount,
    currency: tx.settlementDisplayCurrency,
  })

  const formattedSecondaryAmount =
    tx.settlementDisplayCurrency === tx.settlementCurrency
      ? undefined
      : formattedSettlementAmount

  return (
    <ListItem
      {...testProps("transaction-item")}
      containerStyle={styles.container}
      onPress={() =>
        navigation.navigate("transactionDetail", {
          txid: tx.id,
        })
      }
    >
      <IconTransaction
        onChain={tx.settlementVia.__typename === "SettlementViaOnChain"}
        isReceive={isReceive}
        pending={isPending}
        walletCurrency={walletCurrency}
      />
      <ListItem.Content {...testProps("list-item-content")}>
        <ListItem.Title
          numberOfLines={1}
          ellipsizeMode="tail"
          {...testProps("tx-description")}
        >
          {description}
        </ListItem.Title>
        <ListItem.Subtitle>
          {subtitle ? <TransactionDate diffDate={true} {...tx} /> : undefined}
        </ListItem.Subtitle>
      </ListItem.Content>

      <HideableArea
        isContentVisible={isBalanceHidden}
        hiddenContent={<Icon style={styles.hiddenBalanceContainer} name="eye" />}
      >
        <View>
          <Text style={AmountDisplayStyle({ isReceive, isPending })}>
            {formattedDisplayAmount}
          </Text>
          {formattedSecondaryAmount ? (
            <Text style={AmountDisplayStyle({ isReceive, isPending })}>
              {formattedSecondaryAmount}
            </Text>
          ) : null}
        </View>
      </HideableArea>
    </ListItem>
  )
}

type UseStyleProps = {
  isFirst?: boolean
  isLast?: boolean
  isOnHomeScreen?: boolean
}

export const DummyTransactionItem: React.FC<DummyProps> = ({
  isBalanceHidden = false,
}) => {
  const { LL } = useI18nContext()
  const styles = useStyles()

  return (
    <ListItem {...testProps("transaction-item")} containerStyle={styles.container}>
      <ListItem.Content {...testProps("list-item-content")}>
        <ListItem.Title
          numberOfLines={1}
          ellipsizeMode="tail"
          {...testProps("tx-description")}
        >
          <Text style={styles.pending}>{LL.TransactionScreen.noTransaction()}</Text>
        </ListItem.Title>
      </ListItem.Content>

      <HideableArea
        isContentVisible={isBalanceHidden}
        hiddenContent={<Icon style={styles.hiddenBalanceContainer} name="eye" />}
      >
        <View>
          <Text style={styles.pending}>- - - -</Text>
        </View>
      </HideableArea>
    </ListItem>
  )
}

const useStyles = makeStyles(({ colors }, props: UseStyleProps) => ({
  container: {
    height: 60,
    paddingLeft: 5,
    paddingRight: 30,
    paddingVertical: 9,
    borderColor: colors.grey4,
    overflow: "hidden",
    backgroundColor: colors.grey5,
    borderTopWidth: (props.isFirst && props.isOnHomeScreen) || !props.isFirst ? 1 : 0,
    borderBottomLeftRadius: props.isLast && props.isOnHomeScreen ? 12 : 0,
    borderBottomRightRadius: props.isLast && props.isOnHomeScreen ? 12 : 0,
  },
  hiddenBalanceContainer: {
    fontSize: 16,
    color: colors.grey0,
  },
  pending: {
    color: colors.grey3,
    textAlign: "right",
    flexWrap: "wrap",
  },
  receiveBtc: {
    color: colors.primary,
    textAlign: "right",
    flexWrap: "wrap",
  },
  receiveUsd: {
    color: colors.green,
    textAlign: "right",
    flexWrap: "wrap",
  },
  receive: {
    color: colors.white,
    textAlign: "right",
    flexWrap: "wrap",
  },
  send: {
    color: colors.grey0,
    textAlign: "right",
    flexWrap: "wrap",
  },
}))
