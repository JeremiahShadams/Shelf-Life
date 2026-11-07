const fs = require('fs');
const path = require('path');

console.log('[patch-cmake] Ensuring CMakeLists and build.gradle.kts prevent Windows MAX_PATH errors...');

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

// 1. Worklets: ensure root CMakeLists.txt exists
const workletsRoot = path.resolve(__dirname, '../node_modules/react-native-worklets');
const workletsRootCmake = path.join(workletsRoot, 'CMakeLists.txt');
const workletsCmakeContent = `project(Worklets)
cmake_minimum_required(VERSION 3.16)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_CXX_STANDARD 20)

find_package(fbjni REQUIRED CONFIG)
find_package(ReactAndroid REQUIRED CONFIG)
find_package(hermes-engine REQUIRED CONFIG)

include("\${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")
add_compile_options(\${folly_FLAGS})

string(APPEND CMAKE_CXX_FLAGS " -DWORKLETS_VERSION=\${WORKLETS_VERSION} -DWORKLETS_FEATURE_FLAGS=\\"\${WORKLETS_FEATURE_FLAGS}\\"")
set(HERMES_V1_ENABLED "\${HERMES_V1_ENABLED}")
string(APPEND CMAKE_CXX_FLAGS " -fno-omit-frame-pointer -fstack-protector-all")

if(\${WORKLETS_PROFILING})
  string(APPEND CMAKE_CXX_FLAGS " -DWORKLETS_PROFILING")
endif()
if(\${IS_REANIMATED_EXAMPLE_APP})
  string(APPEND CMAKE_CXX_FLAGS " -DIS_REANIMATED_EXAMPLE_APP -Wpedantic")
endif()
if(NOT \${CMAKE_BUILD_TYPE} MATCHES "Debug")
  string(APPEND CMAKE_CXX_FLAGS " -DNDEBUG")
endif()

set(BUILD_DIR "\${CMAKE_CURRENT_SOURCE_DIR}/android/build")
set(ANDROID_CPP_DIR "\${CMAKE_CURRENT_SOURCE_DIR}/android/src/main/cpp")
set(COMMON_CPP_DIR "\${CMAKE_CURRENT_SOURCE_DIR}/Common/cpp")

file(GLOB_RECURSE WORKLETS_COMMON_CPP_SOURCES CONFIGURE_DEPENDS "Common/cpp/worklets/*.cpp")
file(GLOB_RECURSE WORKLETS_ANDROID_CPP_SOURCES CONFIGURE_DEPENDS "android/src/main/cpp/worklets/*.cpp")

add_library(worklets SHARED \${WORKLETS_COMMON_CPP_SOURCES} \${WORKLETS_ANDROID_CPP_SOURCES})
target_precompile_headers(worklets PRIVATE "\${ANDROID_CPP_DIR}/WorkletsPCH.h")
target_compile_options(worklets PRIVATE "$<$<COMPILE_LANGUAGE:CXX>:-Xclang;-fno-pch-timestamp>")

include("\${REACT_NATIVE_DIR}/ReactCommon/cmake-utils/react-native-flags.cmake")
target_compile_reactnative_options(worklets PUBLIC)

target_include_directories(worklets PUBLIC "\${COMMON_CPP_DIR}" "\${ANDROID_CPP_DIR}")
target_include_directories(
  worklets
  PRIVATE "\${REACT_NATIVE_DIR}/ReactCommon"
          "\${REACT_NATIVE_DIR}/ReactCommon/yoga"
          "\${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/react/turbomodule"
          "\${REACT_NATIVE_DIR}/ReactCommon/react/nativemodule/core/ReactCommon"
          "\${REACT_NATIVE_DIR}/ReactCommon/callinvoker"
          "\${REACT_NATIVE_DIR}/ReactCommon/runtimeexecutor"
          "\${REACT_NATIVE_DIR}/ReactCommon/jsiexecutor"
          "\${REACT_NATIVE_DIR}/ReactCommon/react/renderer/graphics/platform/cxx"
)

set_target_properties(worklets PROPERTIES LINKER_LANGUAGE CXX)
target_link_libraries(worklets android log ReactAndroid::reactnative ReactAndroid::jsi fbjni::fbjni hermes-engine::hermesvm)

if(\${HERMES_ENABLE_DEBUGGER})
  string(APPEND CMAKE_CXX_FLAGS " -DHERMES_ENABLE_DEBUGGER=1")
endif()
`;

if (fs.existsSync(workletsRoot)) {
  fs.writeFileSync(workletsRootCmake, workletsCmakeContent, 'utf8');
  console.log(`[patch-cmake] Created/Updated: ${workletsRootCmake}`);
}

// 2. Worklets: patch android/build.gradle.kts to point to ../CMakeLists.txt and set buildStagingDirectory
const workletsGradleKts = path.join(workletsRoot, 'android/build.gradle.kts');
patchFile(
  workletsGradleKts,
  `    externalNativeBuild {
        cmake {
            path = file("CMakeLists.txt")
        }
    }`,
  `    externalNativeBuild {
        cmake {
            path = file("../CMakeLists.txt")
            buildStagingDirectory = file("\${rootDir}/.cxx/worklets")
        }
    }`
);

// 3. Reanimated: ensure root CMakeLists.txt exists
const reanimatedRoot = path.resolve(__dirname, '../node_modules/react-native-reanimated');
const reanimatedRootCmake = path.join(reanimatedRoot, 'CMakeLists.txt');
const reanimatedCmakeContent = `project(Reanimated)
cmake_minimum_required(VERSION 3.16)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_CXX_STANDARD 20)

include("\${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")
add_compile_options(\${folly_FLAGS})

string(APPEND CMAKE_CXX_FLAGS " -DREANIMATED_VERSION=\${REANIMATED_VERSION} -DREANIMATED_FEATURE_FLAGS=\\"\${REANIMATED_FEATURE_FLAGS}\\"")
string(APPEND CMAKE_CXX_FLAGS " -fno-omit-frame-pointer -fstack-protector-all -fvisibility=hidden")

if(\${REANIMATED_PROFILING})
  string(APPEND CMAKE_CXX_FLAGS " -DREANIMATED_PROFILING")
endif()
if(\${IS_REANIMATED_EXAMPLE_APP})
  string(APPEND CMAKE_CXX_FLAGS " -DIS_REANIMATED_EXAMPLE_APP -Wpedantic")
endif()
if(NOT \${CMAKE_BUILD_TYPE} MATCHES "Debug")
  string(APPEND CMAKE_CXX_FLAGS " -DNDEBUG -flto=thin")
endif()

set(BUILD_DIR "\${CMAKE_CURRENT_SOURCE_DIR}/android/build")
set(ANDROID_CPP_DIR "\${CMAKE_CURRENT_SOURCE_DIR}/android/src/main/cpp")
set(COMMON_CPP_DIR "\${CMAKE_CURRENT_SOURCE_DIR}/Common/cpp")
set(NATIVEVIEW_DIR "\${CMAKE_CURRENT_SOURCE_DIR}/Common/NativeView")
set(PACKAGE_ROOT_DIR "\${CMAKE_CURRENT_SOURCE_DIR}")
set(CODEGEN_OUTPUT_DIR "\${BUILD_DIR}/generated/source/codegen/jni")

file(GLOB_RECURSE REANIMATED_COMMON_CPP_SOURCES CONFIGURE_DEPENDS "Common/cpp/reanimated/*.cpp")
file(GLOB_RECURSE REANIMATED_ANDROID_CPP_SOURCES CONFIGURE_DEPENDS "android/src/main/cpp/reanimated/*.cpp")
file(GLOB_RECURSE REANIMATED_NATIVEVIEW_CPP_SOURCES CONFIGURE_DEPENDS "Common/NativeView/react/renderer/components/rnreanimated/*.cpp")

find_package(fbjni REQUIRED CONFIG)
find_package(ReactAndroid REQUIRED CONFIG)
find_package(react-native-worklets REQUIRED CONFIG)

add_library(
  reanimated SHARED
  \${REANIMATED_COMMON_CPP_SOURCES} \${REANIMATED_ANDROID_CPP_SOURCES}
  \${REANIMATED_NATIVEVIEW_CPP_SOURCES})

target_precompile_headers(reanimated PRIVATE "\${ANDROID_CPP_DIR}/ReanimatedPCH.h")
target_compile_options(reanimated PRIVATE "$<$<COMPILE_LANGUAGE:CXX>:-Xclang;-fno-pch-timestamp>")

include("\${REACT_NATIVE_DIR}/ReactCommon/cmake-utils/react-native-flags.cmake")
target_compile_reactnative_options(reanimated PUBLIC)

target_include_directories(
  reanimated
  PRIVATE "\${COMMON_CPP_DIR}"
          "\${ANDROID_CPP_DIR}"
          "\${PACKAGE_ROOT_DIR}"
          "\${CODEGEN_OUTPUT_DIR}"
          "\${REACT_NATIVE_DIR}/ReactCommon"
          "\${REACT_NATIVE_DIR}/ReactCommon/yoga"
          "\${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/react/turbomodule"
          "\${REACT_NATIVE_DIR}/ReactCommon/callinvoker"
          "\${REACT_NATIVE_DIR}/ReactCommon/runtimeexecutor"
          "\${REACT_NATIVE_DIR}/ReactCommon/jsiexecutor"
          "\${REACT_NATIVE_DIR}/ReactCommon/react/renderer/graphics/platform/cxx"
)

set_target_properties(reanimated PROPERTIES LINKER_LANGUAGE CXX)
if(\${CMAKE_BUILD_TYPE} MATCHES "Debug")
  set(BUILD_TYPE "debug")
else()
  set(BUILD_TYPE "release")
endif()

set_target_properties(reanimated PROPERTIES LINK_FLAGS "-Wl,--gc-sections")
if(NOT \${CMAKE_BUILD_TYPE} MATCHES "Debug")
  set_property(TARGET reanimated APPEND_STRING PROPERTY LINK_FLAGS ",--icf=safe")
endif()

target_link_libraries(reanimated log ReactAndroid::reactnative ReactAndroid::jsi fbjni::fbjni android react-native-worklets::worklets)
`;

if (fs.existsSync(reanimatedRoot)) {
  fs.writeFileSync(reanimatedRootCmake, reanimatedCmakeContent, 'utf8');
  console.log(`[patch-cmake] Created/Updated: ${reanimatedRootCmake}`);
}

// 4. Reanimated: patch android/build.gradle.kts to point to ../CMakeLists.txt and set buildStagingDirectory
const reanimatedGradleKts = path.join(reanimatedRoot, 'android/build.gradle.kts');
patchFile(
  reanimatedGradleKts,
  `    externalNativeBuild {
        cmake {
            path = file("CMakeLists.txt")
        }
    }`,
  `    externalNativeBuild {
        cmake {
            path = file("../CMakeLists.txt")
            buildStagingDirectory = file("\${rootDir}/.cxx/reanimated")
        }
    }`
);

console.log('[patch-cmake] Done.');
