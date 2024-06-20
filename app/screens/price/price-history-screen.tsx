import * as React from "react"

import { gql } from "@apollo/client"
import { makeStyles } from "@rneui/themed"

import { PriceHistory } from "../../components/price-history"
import { Screen } from "../../components/screen"

const useStyles = makeStyles((_theme) => ({
  screen: { flex: 1 },
  button: { margin: 20 },
}))

gql`
  query priceHistoryScreen {
    me {
      id
      defaultAccount {
        id
      }
    }
  }
`

export const PriceHistoryScreen: React.FC = () => {
  const styles = useStyles()

  return (
    <Screen preset="scroll" style={styles.screen}>
      <PriceHistory />
    </Screen>
  )
}
