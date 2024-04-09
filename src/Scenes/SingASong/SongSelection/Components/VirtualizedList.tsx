import useBaseUnitPx from 'hooks/useBaseUnitPx';
import { chunk } from 'lodash-es';
import {
  ComponentType,
  CSSProperties,
  ForwardedRef,
  forwardRef,
  Fragment,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  Ref,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Components, GroupedVirtuoso, LocationOptions, LogLevel, VirtuosoHandle } from 'react-virtuoso';
import { SongGroup } from 'Scenes/SingASong/SongSelection/Hooks/useSongList';
import isE2E from 'utils/isE2E';

export interface VirtualizedListMethods {
  virtuoso: VirtuosoHandle | null;
  scrollToTop: () => void;
  scrollToSongInGroup: (group: string, songId: number, behavior?: LocationOptions['behavior']) => Promise<void>;
  scrollToGroup: (group: string) => void;
}

interface Props<T> {
  components: Components<SongGroup, T>;
  context: T;
  groups: SongGroup[];
  placeholder?: ReactNode;
  renderGroup: (group: SongGroup) => ReactNode;
  renderItem: (item: SongGroup['songs'][number], group: SongGroup) => ReactNode;
  footer?: ReactNode;
  ListRowWrapper: ComponentType<PropsWithChildren<{ group: SongGroup }>>;
  GroupRowWrapper: ComponentType<PropsWithChildren<{ group: SongGroup }>>;
  perRow: number;
}

declare global {
  interface Window {
    __virtualListDisable: () => Promise<void>;
  }
}

function VirtualizedListInner<T>(props: Props<T>, ref: ForwardedRef<VirtualizedListMethods>) {
  const baseUnit = useBaseUnitPx();
  const virtuoso = useRef<VirtuosoHandle>(null);
  const [disable, setDisable] = useState(false);

  useEffect(() => {
    window.__virtualListDisable = async () => {
      setDisable(true);
      virtuoso.current?.scrollTo({ top: 1000 });
      virtuoso.current?.scrollTo({ top: 0 });
    };
  }, []);

  const groupedRows = useMemo(() => {
    return props.groups.map((group) => {
      return {
        group,
        rows: chunk(group.songs, props.perRow),
      };
    });
  }, [props.groups, props.perRow]);

  const groupSizes = useMemo(() => groupedRows.map(({ rows }) => rows.length), [groupedRows]);
  const flatRows = useMemo(() => groupedRows.flatMap(({ rows }) => rows), [groupedRows]);

  const { ListRowWrapper, GroupRowWrapper } = props;

  useImperativeHandle(
    ref,
    (): VirtualizedListMethods => ({
      virtuoso: virtuoso.current,
      scrollToTop: () => {
        virtuoso.current?.scrollTo({ top: 0 });
        window.scrollTo(0, 0);
      },
      scrollToGroup: (group: string) => {
        const groupIndex = props.groups.findIndex((g) => g.letter === group);

        if (groupIndex === -1) {
          return;
        }
        const rowsToScroll = groupedRows.slice(0, groupIndex).reduce((acc, { rows }) => acc + rows.length, 0);
        virtuoso.current?.scrollToIndex({ index: rowsToScroll, behavior: 'smooth', align: 'start' });
      },
      scrollToSongInGroup: async (group, index, behavior = 'smooth') => {
        const groupIndex = props.groups.findIndex((g) => g.letter === group);

        if (groupIndex === -1) {
          return;
        }

        const songIndex = props.groups[groupIndex].songs.findIndex((s) => s.index === index);
        if (songIndex === -1) {
          return;
        }

        const rowsToScroll = groupedRows
          .slice(0, groupIndex)
          .reduce((acc, { rows }) => acc + rows.length, Math.floor(songIndex / props.perRow));

        virtuoso.current?.scrollToIndex?.({
          index: rowsToScroll,
          behavior: isE2E() ? 'auto' : behavior,
          align: 'center',
        });
      },
    }),
  );

  return (
    <GroupedVirtuoso
      increaseViewportBy={disable ? Infinity : baseUnit * 50}
      style={styles}
      logLevel={LogLevel.DEBUG}
      components={props.components}
      context={props.context}
      groupContent={(index) => (
        <GroupRowWrapper group={groupedRows[index].group}>
          {props.renderGroup(groupedRows[index].group)}
        </GroupRowWrapper>
      )}
      ref={virtuoso}
      groupCounts={groupSizes}
      itemContent={(index, groupIndex) => (
        <ListRowWrapper group={groupedRows[groupIndex].group}>
          {flatRows[index].map((song) => props.renderItem(song, groupedRows[groupIndex].group))}
          {props.placeholder &&
            flatRows[index].length < props.perRow &&
            new Array(props.perRow - flatRows[index].length)
              .fill(null)
              .map((_, i) => <Fragment key={i}>{props.placeholder}</Fragment>)}
        </ListRowWrapper>
      )}
    />
  );
}

const styles: CSSProperties = {
  overflowX: 'hidden',
};

// https://stackoverflow.com/a/58473012
export const VirtualizedList = forwardRef(VirtualizedListInner) as <T>(
  p: Props<T> & { ref?: Ref<VirtualizedListMethods> },
) => ReactElement;
