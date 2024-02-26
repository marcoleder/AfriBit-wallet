import React from "react"
import { Dimensions, Pressable, StyleProp, View, ViewStyle } from "react-native"
import { makeStyles, useTheme, Text } from "@rneui/themed"
import { Key as KeyType } from "../amount-input-screen/number-pad-reducer"
import { testProps } from "@app/utils/testProps"

const useStyles = makeStyles(({ colors }) => ({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "flex-start",
  },
  keyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  lastKeyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  keyText: {
    color: colors.grey2,
    fontSize: 24,
    fontWeight: "bold",
    textAlignVertical: "center",
  },
  pressedKeyText: {
    color: colors.grey2,
    fontSize: 24,
    fontWeight: "bold",
    textAlignVertical: "center",
    opacity: 0.7,
  },
}))

type CurrencyKeyboardProps = {
  onPress: (pressed: KeyType) => void
}

export const CurrencyKeyboard: React.FC<CurrencyKeyboardProps> = ({ onPress }) => {
  const styles = useStyles()
  return (
    <View style={styles.container}>
        <Key numberPadKey={KeyType[1]} handleKeyPress={onPress} />
        <Key numberPadKey={KeyType[2]} handleKeyPress={onPress} />
        <Key numberPadKey={KeyType[3]} handleKeyPress={onPress} />
        <Key numberPadKey={KeyType[4]} handleKeyPress={onPress} />
        <Key numberPadKey={KeyType[5]} handleKeyPress={onPress} />
        <Key numberPadKey={KeyType[6]} handleKeyPress={onPress} />
        <Key numberPadKey={KeyType[7]} handleKeyPress={onPress} />
        <Key numberPadKey={KeyType[8]} handleKeyPress={onPress} />
        <Key numberPadKey={KeyType[9]} handleKeyPress={onPress} />
        <Key numberPadKey={KeyType.Decimal} handleKeyPress={onPress} />
        <Key numberPadKey={KeyType[0]} handleKeyPress={onPress} />
        <Key numberPadKey={KeyType.Backspace} handleKeyPress={onPress} />
    </View>
  )
}

const Key = ({
  handleKeyPress,
  numberPadKey,
}: {
  numberPadKey: KeyType
  handleKeyPress: (key: KeyType) => void
}) => {
  const {
    theme: { colors },
  } = useTheme()
  const styles = useStyles()
  const height = Dimensions.get("window").height
  const width = Dimensions.get("window").width
  const pressableStyle = ({ pressed }: { pressed: boolean }): StyleProp<ViewStyle> => {
    const baseStyle: StyleProp<ViewStyle> = {
      height: "30%",
      width: "30%",
      borderRadius: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }

    if (pressed) {
      return {
        ...baseStyle,
        backgroundColor: colors.grey4,
      }
    }
    return baseStyle
  }

  return (
    <Pressable
      style={pressableStyle}
      hitSlop={10}
      onPress={() => handleKeyPress(numberPadKey)}
      {...testProps(`Key ${numberPadKey}`)}
    >
      {({ pressed }) => {
        return (
          <Text style={pressed ? styles.pressedKeyText : styles.keyText}>
            {numberPadKey}
          </Text>
        )
      }}
    </Pressable>
  )
}
