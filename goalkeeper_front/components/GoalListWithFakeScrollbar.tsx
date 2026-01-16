import React, { useState } from "react";
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

type Props<T> = {
  items: T[];
  height?: number; // 리스트 영역 높이(고정)
  renderItem: (item: T, index: number) => React.ReactNode;
  contentPaddingBottom?: number;
};

export default function GoalListWithFakeScrollbar<T>({
  items,
  height = 260,
  renderItem,
  contentPaddingBottom = 8,
}: Props<T>) {
  const [thumbTop, setThumbTop] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(24);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;

    const scrollY = contentOffset.y;
    const visibleH = layoutMeasurement.height;
    const contentH = contentSize.height;

    // 스크롤이 필요 없으면 thumb 숨김(원하시면 track도 숨김 처리 가능)
    if (contentH <= visibleH) {
      setThumbTop(0);
      setThumbHeight(0);
      return;
    }

    const trackH = visibleH;
    const ratio = visibleH / contentH;
    //const newThumbH = Math.max(24, trackH * ratio);
    const newThumbH = 40;
    setThumbHeight(newThumbH);

    const maxThumbTop = trackH - newThumbH;
    const maxScroll = contentH - visibleH;
    const newTop = (scrollY / maxScroll) * maxThumbTop;

    setThumbTop(newTop);
  };

  return (
    <View style={[styles.wrap, { height }]}>
      <View style={styles.listArea}>
        <ScrollView
          nestedScrollEnabled
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
        >
          {items.map((item, index) => renderItem(item, index))}
        </ScrollView>

        {/* fake scrollbar */}
        <View pointerEvents="none" style={styles.track}>
          {thumbHeight > 0 && (
            <View style={[styles.thumb,{height: thumbHeight, top: thumbTop}]}>
              <Image
              source={require("../assets/images/thumb-image.png")}
              style={styles.thumbIcon}
              resizeMode="contain"
              />
            </View>
            
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  listArea: {
    flex: 1,
    position: "relative",
    paddingRight: 15, // 스크롤바 자리
  },
  track: { //스크롤 바
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderRadius: 999,
    backgroundColor: "#E0E0E0",
    //overflow: "hidden",
  },
  thumb: { //스크롤
    position: "absolute",
    left: 0,
    right: 0,
    borderRadius: 999,
    backgroundColor: "fff",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbIcon:{
    width: 21,
    height: 21,
  }
});
