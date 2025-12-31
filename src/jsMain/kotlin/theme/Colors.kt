package theme

object Colors {
    // Primary Colors
    const val TealPrimary = "#14B8A6"
    const val EmeraldPrimary = "#10B981"
    const val CyanAccent = "#06B6D4"
    
    // Secondary Colors
    const val OrangeAccent = "#F97316"
    const val AmberAccent = "#FBBF24"
    const val RedBet = "#EF4444"
    
    // Neutrals
    const val Slate50 = "#F8FAFC"
    const val Slate100 = "#F1F5F9"
    const val Slate200 = "#E2E8F0"
    const val Slate900 = "#0F172A"
    const val White = "#FFFFFF"
    
    // Gradients
    const val TealGradient = "linear-gradient(135deg, $TealPrimary 0%, $EmeraldPrimary 50%, $CyanAccent 100%)"
    const val BetGradient = "linear-gradient(135deg, $OrangeAccent 0%, $RedBet 100%)"
    const val OrangeGradient = "linear-gradient(135deg, $OrangeAccent 0%, $AmberAccent 100%)"
}