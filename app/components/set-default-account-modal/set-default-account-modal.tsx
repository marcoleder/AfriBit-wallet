import React from "react"
import { Platform, View, TouchableOpacity, ActivityIndicator } from "react-native"
import { ScrollView } from "react-native-gesture-handler"
import Modal from "react-native-modal"

import { gql, useApolloClient } from "@apollo/client"
import {
  useAccountUpdateDefaultWalletIdMutation,
  useSetDefaultAccountModalQuery,
} from "@app/graphql/generated"
import { getBtcWallet, getUsdWallet } from "@app/graphql/wallets-utils"
import { useI18nContext } from "@app/i18n/i18n-react"
import { RootStackParamList } from "@app/navigation/stack-param-lists"
import crashlytics from "@react-native-firebase/crashlytics"
import { setHasPromptedSetDefaultAccount } from "@app/graphql/client-only-query"
import { useNavigation } from "@react-navigation/native"
import { StackNavigationProp } from "@react-navigation/stack"
import { makeStyles, Text, useTheme } from "@rneui/themed"

import { GaloyCurrencyBubble } from "../atomic/galoy-currency-bubble"
import { GaloyIcon } from "../atomic/galoy-icon"

gql`
  query setDefaultAccountModal {
    me {
      id
      defaultAccount {
        id
        defaultWalletId
        wallets {
          id
          balance
          walletCurrency
        }
      }
    }
  }
`

export type SetDefaultAccountModalProps = {
  isVisible: boolean
  toggleModal: () => void
}

export const SetDefaultAccountModal = ({
  isVisible,
  toggleModal,
}: SetDefaultAccountModalProps) => {
  const [accountUpdateDefaultWallet] = useAccountUpdateDefaultWalletIdMutation()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, "Primary">>()

  const { data } = useSetDefaultAccountModalQuery({
    fetchPolicy: "cache-only",
  })

  const client = useApolloClient()

  const usdWallet = getUsdWallet(data?.me?.defaultAccount?.wallets)
  const btcWallet = getBtcWallet(data?.me?.defaultAccount?.wallets)

  React.useEffect(() => {
    const selectBtcAsDefault = async () => {
      if (btcWallet) {
        try {
          await accountUpdateDefaultWallet({
            variables: {
              input: {
                walletId: btcWallet.id,
              },
            },
          })
        } catch (err) {
          if (err instanceof Error) {
            crashlytics().recordError(err)
          }
        }
      } else if (usdWallet) {
        try {
          await accountUpdateDefaultWallet({
            variables: {
              input: {
                walletId: usdWallet.id,
              },
            },
          })
        } catch (err) {
          if (err instanceof Error) {
            crashlytics().recordError(err)
          }
        }
      }
    }

    if (isVisible) {
      selectBtcAsDefault()
      setHasPromptedSetDefaultAccount(client)
      toggleModal()
      navigation.navigate("receiveBitcoin")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible])

  return <></>
}
