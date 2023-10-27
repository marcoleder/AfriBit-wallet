import React from "react"
import ContentLoader, { Rect } from "react-content-loader/native"
import { Dimensions, Pressable, View } from "react-native"
import { LocalizedString } from "typesafe-i18n"
import { useI18nContext } from "@app/i18n/i18n-react"

import { gql } from "@apollo/client"
import {
  useWalletOverviewScreenQuery,
  WalletCurrency,
  useHomeAuthedQuery,
} from "@app/graphql/generated"
import { useIsAuthed } from "@app/graphql/is-authed-context"
import { useDisplayCurrency } from "@app/hooks/use-display-currency"
import { toBtcMoneyAmount, toUsdMoneyAmount } from "@app/types/amounts"
import { makeStyles, Text, useTheme } from "@rneui/themed"
import { useNavigation } from "@react-navigation/native"
import { StackNavigationProp } from "@react-navigation/stack"

import { GaloyCurrencyBubble } from "../atomic/galoy-currency-bubble"
import { GaloyIcon } from "../atomic/galoy-icon"
import HideableArea from "../hideable-area/hideable-area"
import { getBtcWallet, getUsdWallet } from "@app/graphql/wallets-utils"
import { RootStackParamList } from "@app/navigation/stack-param-lists"
import { TransactionItem, DummyTransactionItem } from "../../components/transaction-item"

const Loader = () => {
  const styles = useStyles()
  return (
    <View style={styles.loaderContainer}>
      <ContentLoader
        height={45}
        width={"60%"}
        speed={1.2}
        backgroundColor={styles.loaderBackground.color}
        foregroundColor={styles.loaderForefound.color}
      >
        <Rect x="0" y="0" rx="4" ry="4" width="100%" height="100%" />
      </ContentLoader>
    </View>
  )
}

gql`
  query walletOverviewScreen {
    me {
      id
      defaultAccount {
        id
        wallets {
          id
          balance
          walletCurrency
        }
      }
    }
  }
`

type Props = {
  loading: boolean
  isContentVisible: boolean
  setIsStablesatModalVisible: (value: boolean) => void
}

const WalletOverview: React.FC<Props> = ({
  loading,
  isContentVisible,
  setIsStablesatModalVisible,
}) => {
  const isAuthed = useIsAuthed()
  const {
    theme: { colors },
  } = useTheme()
  const styles = useStyles()
  const { data } = useWalletOverviewScreenQuery({ skip: !isAuthed })

  type Target = "transactionHistoryBtc" | "transactionHistoryUsd"

  const onMenuClick = (target: Target) => {
    if (isAuthed) {
      // we are using any because Typescript complain on the fact we are not passing any params
      // but there is no need for a params and the types should not necessitate it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigation.navigate(target as any)
    }
  }

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const { LL } = useI18nContext()

  const { formatMoneyAmount, displayCurrency, moneyAmountToDisplayCurrencyString } =
    useDisplayCurrency()

  const [isBtcTransactionsVisible, setIsBtcTransactionsVisible] = React.useState(false)
  const [isUsdTransactionsVisible, setIsUsdTransactionsVisible] = React.useState(false)

  let btcInDisplayCurrencyFormatted: string | undefined = "$0.00"
  let usdInDisplayCurrencyFormatted: string | undefined = "$0.00"
  let btcInUnderlyingCurrency: string | undefined = "0 sat"
  let usdInUnderlyingCurrency: string | undefined = undefined

  const { data: dataAuthed } = useHomeAuthedQuery({
    skip: !isAuthed,
    fetchPolicy: "network-only",
    errorPolicy: "all",

    // this enables offline mode use-case
    nextFetchPolicy: "cache-and-network",
  })

  type TransactionData =
    | {
        title: LocalizedString
        details: React.ReactNode
      }
    | undefined

  let btcDummyTxVisible = false
  let usdDummyTxVisible = false

  let recentBtcTransactionsData: TransactionData = undefined
  let recentUsdTransactionsData: TransactionData = undefined

  const height = Dimensions.get("window").height
  const TRANSACTIONS_TO_SHOW = height < 400 ? 1 : height < 750 ? 2 : 3

  const transactionsEdges =
    dataAuthed?.me?.defaultAccount?.transactions?.edges ?? undefined

  if (isAuthed && transactionsEdges?.length) {
    const btcTransactions = transactionsEdges.filter(
      ({ node }) => node?.settlementCurrency === "BTC",
    )

    if (btcTransactions.length) {
      recentBtcTransactionsData = {
        title: LL.TransactionScreen.title(),
        details: (
          <>
            {btcTransactions
              .slice(0, TRANSACTIONS_TO_SHOW)
              .map(
                ({ node }, index, array) =>
                  node && (
                    <TransactionItem
                      key={`transaction-${node.id}`}
                      txid={node.id}
                      subtitle
                      isOnHomeScreen={true}
                      isLast={index === array.length - 1}
                      isBalanceHidden={isContentVisible}
                    />
                  ),
              )}
          </>
        ),
      }
    } else {
      btcDummyTxVisible = true
    }

    const usdTransactions = transactionsEdges.filter(
      ({ node }) => node?.settlementCurrency === "USD",
    )

    if (usdTransactions.length) {
      recentUsdTransactionsData = {
        title: LL.TransactionScreen.title(),
        details: (
          <>
            {usdTransactions
              .slice(0, TRANSACTIONS_TO_SHOW)
              .map(
                ({ node }, index, array) =>
                  node && (
                    <TransactionItem
                      key={`transaction-${node.id}`}
                      txid={node.id}
                      subtitle
                      isOnHomeScreen={true}
                      isLast={index === array.length - 1}
                      isBalanceHidden={isContentVisible}
                    />
                  ),
              )}
          </>
        ),
      }
    } else {
      usdDummyTxVisible = true
    }
  } else {
    btcDummyTxVisible = true
    usdDummyTxVisible = true
  }

  if (isAuthed) {
    const btcWallet = getBtcWallet(data?.me?.defaultAccount?.wallets)
    const usdWallet = getUsdWallet(data?.me?.defaultAccount?.wallets)

    const btcWalletBalance = toBtcMoneyAmount(btcWallet?.balance ?? NaN)

    const usdWalletBalance = toUsdMoneyAmount(usdWallet?.balance ?? NaN)

    btcInDisplayCurrencyFormatted = moneyAmountToDisplayCurrencyString({
      moneyAmount: btcWalletBalance,
      isApproximate: true,
    })

    usdInDisplayCurrencyFormatted = moneyAmountToDisplayCurrencyString({
      moneyAmount: usdWalletBalance,
      isApproximate: displayCurrency !== WalletCurrency.Usd,
    })

    btcInUnderlyingCurrency = formatMoneyAmount({ moneyAmount: btcWalletBalance })

    if (displayCurrency !== WalletCurrency.Usd) {
      usdInUnderlyingCurrency = formatMoneyAmount({ moneyAmount: usdWalletBalance })
    }
  }

  const toggleIsBtcTransactionsVisible = () => {
    setIsBtcTransactionsVisible((prevState) => !prevState)
  }

  const toggleIsUsdTransactionsVisible = () => {
    setIsUsdTransactionsVisible((prevState) => !prevState)
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.displayTextView}>
          <View style={styles.currency}>
            <Pressable
              hitSlop={{ top: 10, bottom: 10, left: 10 }}
              style={styles.currency}
              onPress={() => onMenuClick("transactionHistoryBtc")}
            >
              <GaloyCurrencyBubble currency="BTC" />
              <Text type="p1">Bitcoin</Text>
            </Pressable>
            <Pressable hitSlop={10} onPress={() => navigation.navigate("receiveBitcoin")}>
              <GaloyIcon color={colors.grey1} name="graph" size={18} />
            </Pressable>
          </View>
          <Pressable
            hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
            onPress={toggleIsBtcTransactionsVisible}
            style={styles.pressable}
          >
            {loading ? (
              <Loader />
            ) : (
              <View style={styles.hideableArea}>
                <HideableArea isContentVisible={isContentVisible}>
                  <Text type="p1" bold>
                    {btcInUnderlyingCurrency}
                  </Text>
                  <Text type="p3">{btcInDisplayCurrencyFormatted}</Text>
                </HideableArea>
              </View>
            )}
            <GaloyIcon
              name={isBtcTransactionsVisible ? "caret-up" : "caret-down"}
              size={24}
            />
          </Pressable>
        </View>
        {recentBtcTransactionsData && isBtcTransactionsVisible ? (
          <>{recentBtcTransactionsData?.details}</>
        ) : null}
        {btcDummyTxVisible && isBtcTransactionsVisible ? (
          <DummyTransactionItem isBalanceHidden={isContentVisible} />
        ) : null}
      </View>
      <View style={styles.container}>
        <View style={styles.displayTextView}>
          <View style={styles.currency}>
            <Pressable
              hitSlop={{ top: 10, bottom: 10, left: 10 }}
              style={styles.currency}
              onPress={() => onMenuClick("transactionHistoryUsd")}
            >
              <GaloyCurrencyBubble currency="USD" />
              <Text type="p1">Stablesats</Text>
            </Pressable>
            <Pressable hitSlop={10} onPress={() => setIsStablesatModalVisible(true)}>
              <GaloyIcon color={colors.grey1} name="question" size={18} />
            </Pressable>
          </View>
          <Pressable
            hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
            onPress={toggleIsUsdTransactionsVisible}
            style={styles.pressable}
          >
            {loading ? (
              <Loader />
            ) : (
              <View style={styles.hideableArea}>
                <HideableArea isContentVisible={isContentVisible}>
                  {usdInUnderlyingCurrency ? (
                    <Text type="p1" bold>
                      {usdInUnderlyingCurrency}
                    </Text>
                  ) : null}
                  <Text
                    type={usdInUnderlyingCurrency ? "p3" : "p1"}
                    bold={!usdInUnderlyingCurrency}
                  >
                    {usdInDisplayCurrencyFormatted}
                  </Text>
                </HideableArea>
              </View>
            )}
            <GaloyIcon
              name={isUsdTransactionsVisible ? "caret-up" : "caret-down"}
              size={24}
            />
          </Pressable>
        </View>
        {recentUsdTransactionsData && isUsdTransactionsVisible ? (
          <>{recentUsdTransactionsData?.details}</>
        ) : null}
        {usdDummyTxVisible && isUsdTransactionsVisible ? (
          <DummyTransactionItem isBalanceHidden={isContentVisible} />
        ) : null}
      </View>
    </>
  )
}

export default WalletOverview

const useStyles = makeStyles(({ colors }) => ({
  container: {
    backgroundColor: colors.grey5,
    display: "flex",
    flexDirection: "column",
    marginBottom: 20,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 2,
  },
  loaderBackground: {
    color: colors.loaderBackground,
  },
  loaderForefound: {
    color: colors.loaderForeground,
  },
  myAccounts: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  displayTextView: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 45,
    marginVertical: 4,
    marginTop: 0,
  },
  separator: {
    height: 1,
    backgroundColor: colors.grey4,
    marginVertical: 2,
  },
  titleSeparator: {
    marginTop: 12,
  },
  currency: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
  },
  hideableArea: {
    alignItems: "flex-end",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    height: 45,
    marginTop: 5,
  },
  pressable: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
  },
}))
