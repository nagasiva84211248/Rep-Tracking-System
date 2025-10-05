import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native'
import React from 'react'

interface ImageButtonComponentProps {
    onPress: () => void,
    imageSource: any,
    position?: ViewStyle,
    disable?: boolean,
}

const ImageButtonComponent: React.FC<ImageButtonComponentProps> = ({ onPress, imageSource, position, disable }) => {
    return (
        <View style={[styles.btnReset,{top:70, ...position}]}>
            <TouchableOpacity onPress={onPress} style={styles.btnMenuBar}>
                <Image source={imageSource} style={styles.menubar} />
            </TouchableOpacity>
        </View>
    )
}

export default ImageButtonComponent

const styles = StyleSheet.create({
    btnReset: {
        position: 'absolute', 
    },
    btnMenuBar: {
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menubar: {
        height: 25,
        width: 25
    },
})