plugins {
    kotlin("js") version "1.9.20"
    kotlin("plugin.serialization") version "1.9.20"
}

group = "com.bindme"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    // React, React DOM + Wrappers
    implementation(enforcedPlatform("org.jetbrains.kotlin-wrappers:kotlin-wrappers-bom:1.0.0-pre.430"))
    implementation("org.jetbrains.kotlin-wrappers:kotlin-react")
    implementation("org.jetbrains.kotlin-wrappers:kotlin-react-dom")
    implementation("org.jetbrains.kotlin-wrappers:kotlin-react-router-dom")
    
    // Kotlin React Emotion (CSS)
    implementation("org.jetbrains.kotlin-wrappers:kotlin-emotion")
    
    // Coroutines & serialization
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
    
    // Additional React components
    implementation(npm("react-icons", "4.12.0"))
    implementation(npm("framer-motion", "10.16.4"))
    implementation(npm("react-hook-form", "7.47.0"))
}

kotlin {
    js(IR) {
        binaries.executable()
        browser {
            commonWebpackConfig {
                cssSupport {
                    enabled.set(true)
                }
            }
        }
    }
}