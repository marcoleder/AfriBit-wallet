import { makeStyles } from "@rneui/themed"
import * as React from "react"
import { PriceHistory } from "../../components/price-history"
import { Screen } from "../../components/screen"
import { gql } from "@apollo/client"

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
