const fs = require('fs');
const path = require('path');

console.log('[patch-cmake] Ensuring CMakeLists use relative paths to prevent Windows MAX_PATH errors...');

function patchFile(filePath, search, replacement) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(search)) {
    content = content.replace(search, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-cmake] Patched: ${filePath}`);
  }
}

// 1. Patch react-native-worklets CMakeLists.txt
const workletsCmake = path.resolve(__dirname, '../node_modules/react-native-worklets/android/CMakeLists.txt');
patchFile(
  workletsCmake,
  `file(GLOB_RECURSE WORKLETS_COMMON_CPP_SOURCES CONFIGURE_DEPENDS
     "\${COMMON_CPP_DIR}/worklets/*.cpp")
file(GLOB_RECURSE WORKLETS_ANDROID_CPP_SOURCES CONFIGURE_DEPENDS
     "\${ANDROID_CPP_DIR}/worklets/*.cpp")`,
  `file(GLOB_RECURSE WORKLETS_COMMON_CPP_SOURCES CONFIGURE_DEPENDS
     RELATIVE \${CMAKE_CURRENT_SOURCE_DIR}
     "../Common/cpp/worklets/*.cpp")
file(GLOB_RECURSE WORKLETS_ANDROID_CPP_SOURCES CONFIGURE_DEPENDS
     RELATIVE \${CMAKE_CURRENT_SOURCE_DIR}
     "src/main/cpp/worklets/*.cpp")`
);

// 2. Patch react-native-reanimated android CMakeLists.txt
const reanimatedCmake = path.resolve(__dirname, '../node_modules/react-native-reanimated/android/CMakeLists.txt');
patchFile(
  reanimatedCmake,
  `file(GLOB_RECURSE REANIMATED_COMMON_CPP_SOURCES CONFIGURE_DEPENDS
     "\${COMMON_CPP_DIR}/reanimated/*.cpp")
file(GLOB_RECURSE REANIMATED_ANDROID_CPP_SOURCES CONFIGURE_DEPENDS
     "\${ANDROID_CPP_DIR}/reanimated/*.cpp")
file(GLOB_RECURSE REANIMATED_NATIVEVIEW_CPP_SOURCES CONFIGURE_DEPENDS
     "\${NATIVEVIEW_DIR}/react/renderer/components/rnreanimated/*.cpp")`,
  `file(GLOB_RECURSE REANIMATED_COMMON_CPP_SOURCES CONFIGURE_DEPENDS
     RELATIVE \${CMAKE_CURRENT_SOURCE_DIR}
     "../Common/cpp/reanimated/*.cpp")
file(GLOB_RECURSE REANIMATED_ANDROID_CPP_SOURCES CONFIGURE_DEPENDS
     RELATIVE \${CMAKE_CURRENT_SOURCE_DIR}
     "src/main/cpp/reanimated/*.cpp")
file(GLOB_RECURSE REANIMATED_NATIVEVIEW_CPP_SOURCES CONFIGURE_DEPENDS
     RELATIVE \${CMAKE_CURRENT_SOURCE_DIR}
     "../Common/NativeView/react/renderer/components/rnreanimated/*.cpp")`
);

// 3. Patch react-native-reanimated NativeView CMakeLists.txt
const reanimatedNativeViewCmake = path.resolve(__dirname, '../node_modules/react-native-reanimated/Common/NativeView/CMakeLists.txt');
patchFile(
  reanimatedNativeViewCmake,
  `file(
  GLOB CODEGEN_ORIGINAL_SRCS CONFIGURE_DEPENDS
  \${CODEGEN_JNI_DIR}/*.cpp
  \${CODEGEN_COMPONENTS_DIR}/*.cpp
)`,
  `file(
  GLOB CODEGEN_ORIGINAL_SRCS CONFIGURE_DEPENDS
  RELATIVE \${CMAKE_CURRENT_SOURCE_DIR}
  ../../android/build/generated/source/codegen/jni/*.cpp
  ../../android/build/generated/source/codegen/jni/react/renderer/components/rnreanimated/*.cpp
)`
);

console.log('[patch-cmake] Done.');
