import { gql } from "@apollo/client"
import { AmountInput } from "@app/components/amount-input/amount-input"
import { GaloyPrimaryButton } from "@app/components/atomic/galoy-primary-button"
import { Screen } from "@app/components/screen"
import {
  useSendBitcoinDetailsScreenQuery,
  useSendBitcoinInternalLimitsQuery,
  useSendBitcoinWithdrawalLimitsQuery,
  Wallet,
  WalletCurrency,
} from "@app/graphql/generated"
import { useIsAuthed } from "@app/graphql/is-authed-context"
import { useLevel } from "@app/graphql/level-context"
import { usePriceConversion } from "@app/hooks"
import { useDisplayCurrency } from "@app/hooks/use-display-currency"
import { useI18nContext } from "@app/i18n/i18n-react"
import { RootStackParamList } from "@app/navigation/stack-param-lists"
import {
  DisplayCurrency,
  MoneyAmount,
  toBtcMoneyAmount,
  toUsdMoneyAmount,
  WalletOrDisplayCurrency,
} from "@app/types/amounts"
import { decodeInvoiceString, Network as NetworkLibGaloy } from "@galoymoney/client"
import crashlytics from "@react-native-firebase/crashlytics"
import { NavigationProp, RouteProp, useNavigation } from "@react-navigation/native"
import { makeStyles, Text, useTheme } from "@rneui/themed"
import React, { useEffect, useState } from "react"
import { TouchableWithoutFeedback, View } from "react-native"
import ReactNativeModal from "react-native-modal"
import Icon from "react-native-vector-icons/Ionicons"
import { testProps } from "../../utils/testProps"
import { isValidAmount } from "./payment-details"
import { PaymentDetail } from "./payment-details/index.types"
import { SendBitcoinDetailsExtraInfo } from "./send-bitcoin-details-extra-info"
import { requestInvoice, utils } from "lnurl-pay"
import { GaloyTertiaryButton } from "@app/components/atomic/galoy-tertiary-button"
import { getBtcWallet, getDefaultWallet, getUsdWallet } from "@app/graphql/wallets-utils"
import { NoteInput } from "@app/components/note-input"
import { PaymentDestinationDisplay } from "@app/components/payment-destination-display"

gql`
  query sendBitcoinDetailsScreen {
    globals {
      network
    }
    me {
      id
      defaultAccount {
        id
        defaultWalletId
        wallets {
          id
          walletCurrency
          balance
        }
      }
    }
  }

  query sendBitcoinWithdrawalLimits {
    me {
      id
      defaultAccount {
        id
        limits {
          withdrawal {
            totalLimit
            remainingLimit
            interval
          }
        }
      }
    }
  }

  query sendBitcoinInternalLimits {
    me {
      id
      defaultAccount {
        id
        limits {
          internalSend {
            totalLimit
            remainingLimit
            interval
          }
        }
      }
    }
  }
`

type Props = {
  route: RouteProp<RootStackParamList, "sendBitcoinDetails">
}

const SendBitcoinDetailsScreen: React.FC<Props> = ({ route }) => {
  const {
    theme: { colors },
  } = useTheme()
  const styles = useStyles()

  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "sendBitcoinDetails">>()

  const { currentLevel } = useLevel()

  const { data } = useSendBitcoinDetailsScreenQuery({
    fetchPolicy: "cache-first",
    returnPartialData: true,
    skip: !useIsAuthed(),
  })

  const { formatDisplayAndWalletAmount } = useDisplayCurrency()
  const { LL } = useI18nContext()
  const [isLoadingLnurl, setIsLoadingLnurl] = useState(false)

  const { convertMoneyAmount: _convertMoneyAmount } = usePriceConversion()
  const { zeroDisplayAmount } = useDisplayCurrency()

  const defaultWallet = getDefaultWallet(
    data?.me?.defaultAccount?.wallets,
    data?.me?.defaultAccount?.defaultWalletId,
  )

  const btcWallet = getBtcWallet(data?.me?.defaultAccount?.wallets)
  const usdWallet = getUsdWallet(data?.me?.defaultAccount?.wallets)

  const network = data?.globals?.network

  const wallets = data?.me?.defaultAccount?.wallets
  const { paymentDestination } = route.params

  const [paymentDetail, setPaymentDetail] =
    useState<PaymentDetail<WalletCurrency> | null>(null)

  const { data: withdrawalLimitsData } = useSendBitcoinWithdrawalLimitsQuery({
    fetchPolicy: "no-cache",
    skip:
      !useIsAuthed() ||
      !paymentDetail?.paymentType ||
      paymentDetail.paymentType === "intraledger",
  })

  const { data: intraledgerLimitsData } = useSendBitcoinInternalLimitsQuery({
    fetchPolicy: "no-cache",
    skip:
      !useIsAuthed() ||
      !paymentDetail?.paymentType ||
      paymentDetail.paymentType !== "intraledger",
  })

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [asyncErrorMessage, setAsyncErrorMessage] = useState("")

  // we are caching the _convertMoneyAmount when the screen loads.
  // this is because the _convertMoneyAmount can change while the user is on this screen
  // and we don't want to update the payment detail with a new convertMoneyAmount
  useEffect(() => {
    if (!_convertMoneyAmount) {
      return
    }

    setPaymentDetail(
      (paymentDetail) =>
        paymentDetail && paymentDetail.setConvertMoneyAmount(_convertMoneyAmount),
    )
  }, [_convertMoneyAmount, setPaymentDetail])

  // we set the default values when the screen loads
  // this only run once (doesn't re-run after paymentDetail is set)
  useEffect(() => {
    if (paymentDetail || !defaultWallet || !_convertMoneyAmount) {
      return
    }

    let initialPaymentDetail = paymentDestination.createPaymentDetail({
      convertMoneyAmount: _convertMoneyAmount,
      sendingWalletDescriptor: {
        id: defaultWallet.id,
        currency: defaultWallet.walletCurrency,
      },
    })

    // Start with usd as the unit of account
    if (initialPaymentDetail.canSetAmount) {
      initialPaymentDetail = initialPaymentDetail.setAmount(zeroDisplayAmount)
    }

    setPaymentDetail(initialPaymentDetail)
  }, [
    setPaymentDetail,
    paymentDestination,
    _convertMoneyAmount,
    paymentDetail,
    defaultWallet,
    btcWallet,
    zeroDisplayAmount,
  ])

  if (!paymentDetail) {
    return <></>
  }

  const { sendingWalletDescriptor, convertMoneyAmount } = paymentDetail
  const lnurlParams =
    paymentDetail?.paymentType === "lnurl" ? paymentDetail?.lnurlParams : undefined

  const btcBalanceMoneyAmount = toBtcMoneyAmount(btcWallet?.balance)

  const usdBalanceMoneyAmount = toUsdMoneyAmount(usdWallet?.balance)

  const btcWalletText = formatDisplayAndWalletAmount({
    displayAmount: convertMoneyAmount(btcBalanceMoneyAmount, DisplayCurrency),
    walletAmount: btcBalanceMoneyAmount,
  })

  const usdWalletText = formatDisplayAndWalletAmount({
    displayAmount: convertMoneyAmount(usdBalanceMoneyAmount, DisplayCurrency),
    walletAmount: usdBalanceMoneyAmount,
  })

  const amountStatus = isValidAmount({
    paymentDetail,
    usdWalletAmount: usdBalanceMoneyAmount,
    btcWalletAmount: btcBalanceMoneyAmount,
    intraledgerLimits: intraledgerLimitsData?.me?.defaultAccount?.limits?.internalSend,
    withdrawalLimits: withdrawalLimitsData?.me?.defaultAccount?.limits?.withdrawal,
  })

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible)
  }

  const chooseWallet = (wallet: Pick<Wallet, "id" | "walletCurrency">) => {
    let updatedPaymentDetail = paymentDetail.setSendingWalletDescriptor({
      id: wallet.id,
      currency: wallet.walletCurrency,
    })

    // switch back to the display currency
    if (updatedPaymentDetail.canSetAmount) {
      const displayAmount = updatedPaymentDetail.convertMoneyAmount(
        paymentDetail.unitOfAccountAmount,
        DisplayCurrency,
      )
      updatedPaymentDetail = updatedPaymentDetail.setAmount(displayAmount)
    }

    setPaymentDetail(updatedPaymentDetail)
    toggleModal()
  }

  const walletContainerStyle = (paymentDetail, wallet) => {
    const isPaymentCurrencyBtc =
      paymentDetail.sendingWalletDescriptor.currency === WalletCurrency.Btc
    const isWalletCurrencyBtc = wallet.walletCurrency === WalletCurrency.Btc
    if (isPaymentCurrencyBtc) {
      return isWalletCurrencyBtc
        ? styles.walletContainerBtcSelected
        : styles.walletContainerNoSelection
    }
    return isWalletCurrencyBtc
      ? styles.walletContainerNoSelection
      : styles.walletContainerUsdSelected
  }

  const walletSelectorTypeLabelStyle = (paymentDetail, wallet) => {
    const isPaymentCurrencyBtc =
      paymentDetail.sendingWalletDescriptor.currency === WalletCurrency.Btc
    const isWalletCurrencyBtc = wallet.walletCurrency === WalletCurrency.Btc
    if (isPaymentCurrencyBtc) {
      return isWalletCurrencyBtc
        ? styles.walletSelectorTypeLabelBitcoinSelected
        : styles.walletSelectorTypeLabelUsd
    }
    return isWalletCurrencyBtc
      ? styles.walletSelectorTypeLabelBitcoin
      : styles.walletSelectorTypeLabelUsdSelected
  }

  const walletSelectorTypeLabelTextStyle = (paymentDetail, wallet) => {
    const isPaymentCurrencyBtc =
      paymentDetail.sendingWalletDescriptor.currency === WalletCurrency.Btc
    const isWalletCurrencyBtc = wallet.walletCurrency === WalletCurrency.Btc
    if (isPaymentCurrencyBtc) {
      return isWalletCurrencyBtc
        ? styles.walletSelectorTypeLabelBtcTextSelected
        : styles.walletSelectorTypeLabelUsdText
    }
    return isWalletCurrencyBtc
      ? styles.walletSelectorTypeLabelBtcText
      : styles.walletSelectorTypeLabelUsdTextSelected
  }

  const walletCurrencyTextStyle = (paymentDetail, wallet) => {
    const isPaymentCurrencyBtc =
      paymentDetail.sendingWalletDescriptor.currency === WalletCurrency.Btc
    const isWalletCurrencyBtc = wallet.walletCurrency === WalletCurrency.Btc
    if (isPaymentCurrencyBtc) {
      return isWalletCurrencyBtc
        ? styles.walletCurrencyTextSelected
        : styles.walletCurrencyText
    }
    return isWalletCurrencyBtc
      ? styles.walletCurrencyText
      : styles.walletCurrencyTextSelected
  }

  const walletBalanceTextStyle = (paymentDetail, wallet) => {
    const isPaymentCurrencyBtc =
      paymentDetail.sendingWalletDescriptor.currency === WalletCurrency.Btc
    const isWalletCurrencyBtc = wallet.walletCurrency === WalletCurrency.Btc
    if (isPaymentCurrencyBtc) {
      return isWalletCurrencyBtc
        ? styles.walletBalanceTextSelected
        : styles.walletBalanceText
    }
    return isWalletCurrencyBtc
      ? styles.walletBalanceText
      : styles.walletBalanceTextSelected
  }

  const ChooseWalletModal = wallets && (
    <View>
      {wallets.map((wallet) => {
        return (
          <TouchableWithoutFeedback
            key={wallet.id}
            onPress={() => {
              chooseWallet(wallet)
            }}
          >
            <View style={walletContainerStyle(paymentDetail, wallet)}>
              <View style={styles.walletSelectorTypeContainer}>
                <View style={walletSelectorTypeLabelStyle(paymentDetail, wallet)}>
                  {wallet.walletCurrency === WalletCurrency.Btc ? (
                    <Text style={walletSelectorTypeLabelTextStyle(paymentDetail, wallet)}>
                      BTC
                    </Text>
                  ) : (
                    <Text style={walletSelectorTypeLabelTextStyle(paymentDetail, wallet)}>
                      USD
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.walletSelectorInfoContainer}>
                <View style={styles.walletSelectorTypeTextContainer}>
                  {wallet.walletCurrency === WalletCurrency.Btc ? (
                    <Text
                      style={walletCurrencyTextStyle(paymentDetail, wallet)}
                    >{`${LL.common.btcAccount()}`}</Text>
                  ) : (
                    <Text
                      style={walletCurrencyTextStyle(paymentDetail, wallet)}
                    >{`${LL.common.usdAccount()}`}</Text>
                  )}
                </View>
                <View style={styles.walletSelectorBalanceContainer}>
                  {wallet.walletCurrency === WalletCurrency.Btc ? (
                    <Text style={walletBalanceTextStyle(paymentDetail, wallet)}>
                      {btcWalletText}
                    </Text>
                  ) : (
                    <Text style={walletBalanceTextStyle(paymentDetail, wallet)}>
                      {usdWalletText}
                    </Text>
                  )}
                </View>
                <View />
              </View>
            </View>
          </TouchableWithoutFeedback>
        )
      })}
    </View>
  )

  const goToNextScreen =
    (paymentDetail.sendPaymentMutation ||
      (paymentDetail.paymentType === "lnurl" && paymentDetail.unitOfAccountAmount)) &&
    (async () => {
      let paymentDetailForConfirmation: PaymentDetail<WalletCurrency> = paymentDetail

      if (paymentDetail.paymentType === "lnurl") {
        try {
          setIsLoadingLnurl(true)

          const btcAmount = paymentDetail.convertMoneyAmount(
            paymentDetail.unitOfAccountAmount,
            "BTC",
          )

          const result = await requestInvoice({
            lnUrlOrAddress: paymentDetail.destination,
            tokens: utils.toSats(btcAmount.amount),
          })
          setIsLoadingLnurl(false)
          const invoice = result.invoice
          const decodedInvoice = decodeInvoiceString(invoice, network as NetworkLibGaloy)

          if (
            Math.round(Number(decodedInvoice.millisatoshis) / 1000) !== btcAmount.amount
          ) {
            setAsyncErrorMessage(LL.SendBitcoinScreen.lnurlInvoiceIncorrectAmount())
            return
          }

          const decodedDescriptionHash = decodedInvoice.tags.find(
            (tag) => tag.tagName === "purpose_commit_hash",
          )?.data

          if (paymentDetail.lnurlParams.metadataHash !== decodedDescriptionHash) {
            setAsyncErrorMessage(LL.SendBitcoinScreen.lnurlInvoiceIncorrectDescription())
            return
          }

          paymentDetailForConfirmation = paymentDetail.setInvoice({
            paymentRequest: invoice,
            paymentRequestAmount: btcAmount,
          })
        } catch (error) {
          setIsLoadingLnurl(false)
          if (error instanceof Error) {
            crashlytics().recordError(error)
          }
          setAsyncErrorMessage(LL.SendBitcoinScreen.failedToFetchLnurlInvoice())
          return
        }
      }

      if (paymentDetailForConfirmation.sendPaymentMutation) {
        navigation.navigate("sendBitcoinConfirmation", {
          paymentDetail: paymentDetailForConfirmation,
        })
      }
    })

  const setAmount = (moneyAmount: MoneyAmount<WalletOrDisplayCurrency>) => {
    setPaymentDetail((paymentDetail) =>
      paymentDetail?.setAmount ? paymentDetail.setAmount(moneyAmount) : paymentDetail,
    )
  }

  const sendAll = () => {
    let moneyAmount: MoneyAmount<WalletCurrency>

    if (paymentDetail.sendingWalletDescriptor.currency === WalletCurrency.Btc) {
      moneyAmount = {
        amount: btcWallet?.balance ?? 0,
        currency: WalletCurrency.Btc,
        currencyCode: "BTC",
      }
    } else {
      moneyAmount = {
        amount: usdWallet?.balance ?? 0,
        currency: WalletCurrency.Usd,
        currencyCode: "USD",
      }
    }

    setPaymentDetail((paymentDetail) =>
      paymentDetail?.setAmount
        ? paymentDetail.setAmount(moneyAmount, true)
        : paymentDetail,
    )
  }

  return (
    <Screen
      preset="scroll"
      style={styles.screenStyle}
      keyboardOffset="navigationHeader"
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.sendBitcoinAmountContainer}>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldTitleText}>{LL.SendBitcoinScreen.destination()}</Text>
          <View style={styles.disabledFieldBackground}>
            <PaymentDestinationDisplay
              destination={paymentDetail.destination}
              paymentType={paymentDetail.paymentType}
            />
          </View>
        </View>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldTitleText}>{LL.common.from()}</Text>
          {ChooseWalletModal}
        </View>
        <View style={styles.fieldContainer}>
          <View style={styles.amountRightMaxField}>
            <Text {...testProps(LL.SendBitcoinScreen.amount())} style={styles.amountText}>
              {LL.SendBitcoinScreen.amount()}
            </Text>
            {paymentDetail.canSendMax && !paymentDetail.isSendingMax && (
              <GaloyTertiaryButton
                clear
                title={LL.SendBitcoinScreen.maxAmount()}
                onPress={sendAll}
              />
            )}
          </View>
          <View style={styles.currencyInputContainer}>
            <AmountInput
              unitOfAccountAmount={paymentDetail.unitOfAccountAmount}
              setAmount={setAmount}
              convertMoneyAmount={paymentDetail.convertMoneyAmount}
              walletCurrency={sendingWalletDescriptor.currency}
              canSetAmount={paymentDetail.canSetAmount}
              isSendingMax={paymentDetail.isSendingMax}
              maxAmount={lnurlParams?.max ? toBtcMoneyAmount(lnurlParams.max) : undefined}
              minAmount={lnurlParams?.min ? toBtcMoneyAmount(lnurlParams.min) : undefined}
            />
          </View>
        </View>
        <SendBitcoinDetailsExtraInfo
          errorMessage={asyncErrorMessage}
          amountStatus={amountStatus}
          currentLevel={currentLevel}
        />
        <View style={styles.buttonContainer}>
          <GaloyPrimaryButton
            onPress={goToNextScreen || undefined}
            loading={isLoadingLnurl}
            disabled={!goToNextScreen || !amountStatus.validAmount}
            title={LL.common.next()}
          />
        </View>
      </View>
    </Screen>
  )
}

export default SendBitcoinDetailsScreen

const useStyles = makeStyles(({ colors }) => ({
  sendBitcoinAmountContainer: {
    flex: 1,
  },
  fieldBackground: {
    flexDirection: "row",
    borderStyle: "solid",
    overflow: "hidden",
    backgroundColor: colors.grey5,
    borderRadius: 10,
    alignItems: "center",
    padding: 14,
    minHeight: 60,
  },
  disabledFieldBackground: {
    flexDirection: "row",
    borderStyle: "solid",
    overflow: "hidden",
    backgroundColor: colors.grey5,
    borderRadius: 10,
    alignItems: "center",
    padding: 14,
    minHeight: 60,
    opacity: 0.5,
  },
  walletContainerBtcSelected: {
    flexDirection: "row",
    borderStyle: "solid",
    overflow: "hidden",
    backgroundColor: colors.grey5,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    minHeight: 60,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  walletContainerUsdSelected: {
    flexDirection: "row",
    borderStyle: "solid",
    overflow: "hidden",
    backgroundColor: colors.grey5,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    minHeight: 60,
    borderColor: colors.green,
    borderWidth: 1,
  },
  walletContainerNoSelection: {
    flexDirection: "row",
    borderStyle: "solid",
    overflow: "hidden",
    backgroundColor: colors.grey5,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    minHeight: 60,
    borderColor: colors.grey5,
    borderWidth: 1,
  },
  walletSelectorTypeContainer: {
    justifyContent: "center",
    alignItems: "flex-start",
    width: 50,
    marginRight: 20,
  },
  walletSelectorTypeLabelBitcoin: {
    height: 30,
    width: 50,
    borderRadius: 10,
    backgroundColor: colors.grey5,
    borderColor: colors.primary,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  walletSelectorTypeLabelBitcoinSelected: {
    height: 30,
    width: 50,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  walletSelectorTypeLabelUsd: {
    height: 30,
    width: 50,
    backgroundColor: colors.grey5,
    borderColor: colors.green,
    borderWidth: 3,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  walletSelectorTypeLabelUsdSelected: {
    height: 30,
    width: 50,
    backgroundColor: colors.green,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  walletSelectorTypeLabelBtcText: {
    fontWeight: "bold",
    color: colors.grey2,
  },
  walletSelectorTypeLabelBtcTextSelected: {
    fontWeight: "bold",
    color: colors.white,
  },
  walletSelectorTypeLabelUsdText: {
    fontWeight: "bold",
    color: colors.grey2,
  },
  walletSelectorTypeLabelUsdTextSelected: {
    fontWeight: "bold",
    color: colors.black,
  },
  walletSelectorInfoContainer: {
    flex: 1,
    flexDirection: "column",
  },
  walletCurrencyText: {
    fontWeight: "bold",
    fontSize: 18,
    color: colors.grey2,
  },
  walletCurrencyTextSelected: {
    fontWeight: "bold",
    fontSize: 18,
  },
  walletBalanceText: {
    color: colors.grey2,
  },
  walletBalanceTextSelected: {
    color: colors.black,
  },
  walletSelectorTypeTextContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  walletSelectorBalanceContainer: {
    flex: 1,
    flexDirection: "row",
  },
  fieldTitleText: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  currencyInputContainer: {
    flexDirection: "column",
  },
  switchCurrencyIconContainer: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modal: {
    marginBottom: "90%",
  },
  pickWalletIcon: {
    marginRight: 12,
  },
  screenStyle: {
    padding: 20,
    flexGrow: 1,
  },
  amountText: {
    fontWeight: "bold",
  },
  amountRightMaxField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    height: 18,
  },
}))
