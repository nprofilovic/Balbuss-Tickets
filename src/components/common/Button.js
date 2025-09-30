import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = true,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.buttonSmall);
        break;
      case 'large':
        baseStyle.push(styles.buttonLarge);
        break;
      default:
        baseStyle.push(styles.buttonMedium);
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.buttonSecondary);
        break;
      case 'outline':
        baseStyle.push(styles.buttonOutline);
        break;
      case 'ghost':
        baseStyle.push(styles.buttonGhost);
        break;
      case 'danger':
        baseStyle.push(styles.buttonDanger);
        break;
      default:
        baseStyle.push(styles.buttonPrimary);
    }

    // State styles
    if (disabled) {
      baseStyle.push(styles.buttonDisabled);
    }

    if (fullWidth) {
      baseStyle.push(styles.buttonFullWidth);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text];
    
    // Size text styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.textSmall);
        break;
      case 'large':
        baseStyle.push(styles.textLarge);
        break;
      default:
        baseStyle.push(styles.textMedium);
    }

    // Variant text styles
    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.textSecondary);
        break;
      case 'outline':
        baseStyle.push(styles.textOutline);
        break;
      case 'ghost':
        baseStyle.push(styles.textGhost);
        break;
      case 'danger':
        baseStyle.push(styles.textDanger);
        break;
      default:
        baseStyle.push(styles.textPrimary);
    }

    if (disabled) {
      baseStyle.push(styles.textDisabled);
    }

    return baseStyle;
  };

  const getIconColor = () => {
    if (disabled) return colors.textLight;
    
    switch (variant) {
      case 'secondary':
        return colors.textPrimary;
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.primary;
      case 'danger':
        return colors.textWhite;
      default:
        return colors.textWhite;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="small" 
            color={getIconColor()} 
            style={styles.loadingIndicator}
          />
          <Text style={getTextStyle()}>Učitavanje...</Text>
        </View>
      );
    }

    const iconElement = icon && (
      <Ionicons 
        name={icon} 
        size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
        color={getIconColor()}
        style={iconPosition === 'right' ? styles.iconRight : styles.iconLeft}
      />
    );

    return (
      <View style={[
        styles.contentContainer,
        iconPosition === 'right' && styles.contentReverse
      ]}>
        {iconPosition === 'left' && iconElement}
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        {iconPosition === 'right' && iconElement}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonFullWidth: {
    width: '100%',
  },
  
  // Size styles
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonMedium: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  buttonLarge: {
    paddingVertical: 18,
    paddingHorizontal: 24,
  },

  // Variant styles
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.backgroundGray,
  },
  buttonOutline: {
    backgroundColor: colors.transparent,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonGhost: {
    backgroundColor: colors.transparent,
  },
  buttonDanger: {
    backgroundColor: colors.error,
  },
  buttonDisabled: {
    backgroundColor: colors.backgroundGray,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Content styles
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentReverse: {
    flexDirection: 'row-reverse',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginRight: 8,
  },

  // Icon styles
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },

  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textSmall: {
    fontSize: 14,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
  textPrimary: {
    color: colors.textWhite,
  },
  textSecondary: {
    color: colors.textPrimary,
  },
  textOutline: {
    color: colors.primary,
  },
  textGhost: {
    color: colors.primary,
  },
  textDanger: {
    color: colors.textWhite,
  },
  textDisabled: {
    color: colors.textLight,
  },
});

export default Button;