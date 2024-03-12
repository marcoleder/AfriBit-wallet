import * as React from "react"
import { View } from "react-native"

import { useI18nContext } from "@app/i18n/i18n-react"
import { Input, makeStyles, Text, useTheme } from "@rneui/themed"

import { GaloyErrorBox } from "../atomic/galoy-error-box"
import { GaloyIconButton } from "../atomic/galoy-icon-button"
import { GaloyPrimaryButton } from "../atomic/galoy-primary-button"
import { CurrencyKeyboard } from "../currency-keyboard"
import { Key } from "./number-pad-reducer"

export type AmountInputScreenUIProps = {
  primaryCurrencySymbol?: string
  primaryCurrencyFormattedAmount?: string
  primaryCurrencyCode: string
  secondaryCurrencySymbol?: string
  secondaryCurrencyFormattedAmount?: string
  secondaryCurrencyCode?: string
  errorMessage?: string
  setAmountDisabled?: boolean
  onKeyPress: (key: Key) => void
  onPaste: (keys: number) => void
  onToggleCurrency?: () => void
  onClearAmount: () => void
  onSetAmountPress?: () => void
  goBack: () => void
}

const primaryCurrencyDisplayStyle = (
  primaryCurrencyCode: string
) => {
  const styles = useStyles()

  if (primaryCurrencyCode === "SAT") {
    return styles.satCurrencyCodeText
  } else {
    return styles.usdCurrencyCodeText
  }
}

const primaryAmountDisplayStyle = (
  primaryCurrencyCode: string
) => {
  const styles = useStyles()

  if (primaryCurrencyCode === "SAT") {
    return styles.inputSat
  } else {
    return styles.inputUsd
  }
}

export const AmountInputScreenUI: React.FC<AmountInputScreenUIProps> = ({
  primaryCurrencyFormattedAmount,
  primaryCurrencyCode,
  secondaryCurrencySymbol,
  secondaryCurrencyFormattedAmount,
  secondaryCurrencyCode,
  errorMessage,
  onKeyPress,
  onPaste,
  onToggleCurrency,
  onSetAmountPress,
  setAmountDisabled,
  goBack,
}) => {
  const { LL } = useI18nContext()
  const styles = useStyles()
  const { theme } = useTheme()

  return (
    <View style={styles.amountInputScreenContainer}>
      <View style={styles.headerContainer}>
        <Text type={"h1"}>{LL.AmountInputScreen.enterAmount()}</Text>
        <GaloyIconButton size={"medium"} name="close" onPress={goBack} />
      </View>
      <View style={styles.bodyContainer}>
        <View style={styles.amountContainer}>
          <View style={styles.primaryAmountContainer}>
            <Input
              style={primaryAmountDisplayStyle(primaryCurrencyCode)}
              value={primaryCurrencyFormattedAmount}
              showSoftInputOnFocus={false}
              onChangeText={(e) => {
                // remove commas for ease of calculation later on
                const val = e.replaceAll(",", "")
                // TODO adjust for currencies that use commas instead of decimals

                // test for string input that can be either numerical or float
                if (/^\d*\.?\d*$/.test(val.trim())) {
                  const num = Number(val)
                  onPaste(num)
                }
              }}
              inputStyle={styles.primaryNumberText}
              placeholder="0"
              placeholderTextColor={theme.colors.grey3}
              inputContainerStyle={styles.primaryNumberInputContainer}
              renderErrorMessage={false}
            />
            <Text style={primaryCurrencyDisplayStyle(primaryCurrencyCode)}>{primaryCurrencyCode}</Text>
          </View>
          {Boolean(secondaryCurrencyFormattedAmount) && (
            <View style={styles.swapContainer}>
              <GaloyIconButton size={"large"} name="swapHorizontal" onPress={onToggleCurrency} />
            </View>
          )}
          {Boolean(secondaryCurrencyFormattedAmount) && (
            <View style={styles.secondaryAmountContainer}>
              <Text style={styles.secondaryAmountText}>
                {secondaryCurrencySymbol}
                {secondaryCurrencyFormattedAmount}
              </Text>
              <Text style={styles.secondaryAmountCurrencyCodeText}>
                {secondaryCurrencyCode}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.infoContainer}>
          {errorMessage && <GaloyErrorBox errorMessage={errorMessage} />}
        </View>
        <View style={styles.keyboardContainer}>
          <CurrencyKeyboard onPress={onKeyPress} />
        </View>
        <GaloyPrimaryButton
          disabled={!onSetAmountPress || setAmountDisabled}
          onPress={onSetAmountPress}
          title={LL.AmountInputScreen.setAmount()}
        />
      </View>
    </View>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  amountInputScreenContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomColor: colors.black,
    borderBottomWidth: 1,
  },
  amountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingBottom: 16,
    borderBottomColor: colors.black,
    borderBottomWidth: 1,
  },
  usdInput: {
    flexDirection: "row",
    alignItems: "center",
  },
  usdCurrencyCodeText: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "left",
    paddingLeft: 10,
    color: colors._green,
  },
  inputUsd: {
    padding: 0,
    margin: 0,
    color: colors._green,
  },
  satContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  satCurrencyCodeText: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "left",
    paddingLeft: 10,
    color: colors.primary,
  },
  inputSat: {
    padding: 0,
    margin: 0,
    color: colors.primary,
  },
  primaryAmountContainer: {
    flexDirection: "column",
    justifyContent: "flex-start",
    width: "40%",
  },
  primaryCurrencySymbol: {
    fontSize: 22,
    fontWeight: "bold",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryNumberText: {
    fontSize: 22,
    fontWeight: "bold",
    alignItems: "flex-start",
  },
  primaryNumberInputContainer: {
    borderBottomWidth: 0,
  },
  secondaryAmountContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    width: "40%",
    paddingRight: 10,
  },
  secondaryAmountText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "bold",
  },
  secondaryAmountCurrencyCodeText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "bold",
  },
  swapContainer: {
    alignItems: "center",
    width: "20%",
  },
  horizontalLine: {
    borderBottomColor: colors.primary4,
    borderBottomWidth: 1,
    flex: 1,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "flex-start",
  },
  bodyContainer: {
    flex: 1,
    padding: 12,
  },
  buttonContainer: {},
  keyboardContainer: {
    paddingHorizontal: 16,
  },
}))
