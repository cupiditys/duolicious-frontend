import {
  Animated,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  memo,
} from 'react';
import { TopNavBar } from './top-nav-bar';
import { DefaultText } from './default-text';
import { ButtonGroup } from './button-group';
import { AnsweredQuizCard } from './quiz-card';
import { DefaultFlatList } from './default-flat-list';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ArrowLeft, ArrowRight } from "react-native-feather";
import { Chart } from './chart';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/api';

const sideMargins: StyleProp<ViewStyle> = {
  marginLeft: 10,
  marginRight: 10,
};

const AnsweredQuizCard_ = (props: {
  children: any,
  questionNumber: number
  topic: string,
  user1: string,
  answer1: boolean | null,
  user2: string,
  answer2: boolean | null,
  answer2Publicly: boolean,
}) => <AnsweredQuizCard {...props}/>;

const AnsweredQuizCardMemo = memo(AnsweredQuizCard_);

const Subtitle = ({children}) => {
  return (
    <DefaultText
      style={{
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
        marginTop: 15,
        color: '#888',
        ...sideMargins,
      }}
    >
      {children}
    </DefaultText>
  );
};

const Header = ({
  name,
  idx1,
  idx2,
  idx3,
  idx4,
  onChangeIdx1,
  onChangeIdx2,
  onChangeIdx3,
  onChangeIdx4,
}) => {
  const answersSubtitle = () => {
    var result = name.endsWith('s') ? `${name}' ` : `${name}'s `;

    if (idx3 === 1) result += "Values-Related ";
    if (idx3 === 2) result += "Sex-Related ";
    if (idx3 === 3) result += "Interpersonal ";
    if (idx3 === 4) result += "Other ";

    result += "Q&A Answers";

    if (idx2 === 1) result += " Which You Agree With Each Other About";
    if (idx2 === 2) result += " Which You Disagree With Each Other About";
    if (idx2 === 3) result += " Which You Haven't Answered";

    return result
  };

  const analysisSubtitle = () => {
    if (idx4 === 0) return 'MBTI (Myers–Briggs Type Indicator)';
    if (idx4 === 1) return 'Big 5 Personality Traits';
    if (idx4 === 2) return 'Attachment Style';
    if (idx4 === 3) return 'Politics';
    if (idx4 === 4) return 'Other Traits';
  };

  const subtitle = idx1 === 0 ? answersSubtitle() : analysisSubtitle();

  const determiner = name.endsWith('s') ? "'" : "'s";

  return (
    <>
      <TopNavBar
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          minHeight: 40,
          height: undefined,
        }}
        borderColor="transparent"
        shadow={false}
      >
        <DefaultText
          style={{
            width: '100%',
            paddingLeft: 50,
            paddingRight: 50,
            fontWeight: '700',
            fontSize: 20,
            textAlign: 'center',
          }}
        >
          You + {name}
        </DefaultText>
      </TopNavBar>
      <ButtonGroup
        buttons={['Q&A Answers', 'Personality']}
        selectedIndex={idx1}
        onPress={onChangeIdx1}
        containerStyle={sideMargins}
      />
      {idx1 === 0 && <>
        <ButtonGroup
          buttons={['All', 'Agree', 'Disagree', 'Unanswered']}
          selectedIndex={idx2}
          onPress={onChangeIdx2}
          containerStyle={sideMargins}
          secondary={true}
        />
        <ButtonGroup
          buttons={['All', 'Values', 'Sex', 'Interp.', 'Other']}
          selectedIndex={idx3}
          onPress={onChangeIdx3}
          containerStyle={sideMargins}
          secondary={true}
        />
      </>}
      {idx1 === 1 && <>
        <ButtonGroup
          buttons={['MBTI', 'Big 5', 'Att.', 'Politics', 'Other']}
          selectedIndex={idx4}
          onPress={onChangeIdx4}
          containerStyle={sideMargins}
          secondary={true}
        />
        <ButtonGroup
          buttons={['Invisible']}
          selectedIndex={0}
          onPress={() => undefined}
          containerStyle={{
            ...sideMargins,
            opacity: 0
          }}
          secondary={true}
          pointerEvents="none"
        />
      </>}
      <Subtitle>{subtitle}</Subtitle>
    </>
  );
};

const fetchAnswersPage = (
  userId: number,
  agreement: string,
  topic: string,
) => async (
  pageNumber: number,
): Promise<any[]> => {
  const resultsPerPage = 10;
  const offset = resultsPerPage * (pageNumber - 1);

  const response = await api(
    'get',
    `/compare-answers/${userId}` +
    `?topic=${topic}` +
    `&agreement=${agreement}` +
    `&n=${resultsPerPage}` +
    `&o=${offset}`
  );

  const responseList = response.ok ? response.json : [];

  return responseList.map(item => ({
    kind: 'answer',
    item: item,
  }));
};

const fetchPersonalityPage = (userId: number, m: number) => async (n: number): Promise<any[]> => {
  const topics = ['mbti', 'big5', 'attachment', 'politics', 'other'];
  const topic = topics[m];

  if (n === 1) {
    const response = await api('get', `/compare-personalities/${userId}/${topic}`);

    if (response.json === undefined) return undefined;

    return [{
      kind: topic,
      data: response.json,
    }];
  }
  return [];
};

const InDepthScreen = (navigationRef) => ({navigation, route}) => {
  if (navigationRef)
    navigationRef.current = navigation;

  const userId = route.params.userId;
  const name = route.params.name ?? '';

  const [idx1, setIdx1] = useState(0);
  const [idx2, setIdx2] = useState(0);
  const [idx3, setIdx3] = useState(0);
  const [idx4, setIdx4] = useState(0);

  const renderItem = useCallback(({item}) => {
    switch (item.kind) {
      case 'answer':
        return <AnsweredQuizCardMemo
            questionNumber={item.item.question_id}
            topic={item.item.topic}
            user1={item.item.prospect_name}
            answer1={item.item.prospect_answer}
            user2="You"
            answer2={item.item.person_answer}
            answer2Publicly={item.item.person_public_}
          >
            {item.item.question}
          </AnsweredQuizCardMemo>;
      case 'mbti':
      case 'big5':
      case 'politics':
      case 'attachment':
      case 'other':
        return <ChartsMemo data={item.data}/>;
    }
  }, []);

  // TODO: Sometimes a spinner shows up at the bottom of the screen that won't go away
  return <DefaultFlatList
    contentContainerStyle={{
      paddingTop: 0,
      paddingBottom: 20,
    }}
    dataKey={
      idx1 === 1 ? `${idx1}-${idx4}` : `${idx1}-${idx2}-${idx3}`}
    emptyText={
      idx1 === 1 ? undefined : "No Q&A answers to show"}
    endText={
      idx1 === 1 ? undefined : "No more Q&A answers to show"}
    endTextStyle={{
      marginRight: 5,
    }}
    fetchPage={
      idx1 === 1 ?
      fetchPersonalityPage(userId, idx4) :
      fetchAnswersPage(
        userId,
        ['all', 'agree', 'disagree', 'unanswered'][idx2],
        ['all', 'values', 'sex', 'interpersonal', 'other'][idx3],
      )
    }
    ListHeaderComponent={
      <Header
        name={name}
        idx1={idx1}
        idx2={idx2}
        idx3={idx3}
        idx4={idx4}
        onChangeIdx1={setIdx1}
        onChangeIdx2={setIdx2}
        onChangeIdx3={setIdx3}
        onChangeIdx4={setIdx4}
      />
    }
    renderItem={renderItem}
    disableRefresh={true}
  />;
};

const Charts = ({data}) => {
  return (
    <View style={sideMargins}>
      {data.map((trait) =>
        <Chart
          key={JSON.stringify(trait)}
          dimensionName={trait.min_label ? undefined : trait.name}
          minLabel={trait.min_label}
          maxLabel={trait.max_label}
          name1={trait.name1 ?? undefined}
          percentage1={trait.percentage1 ?? undefined}
          name2={trait.name2 ?? undefined}
          percentage2={trait.percentage2 ?? undefined}
        >
          {trait.description}
        </Chart>
      )}
    </View>
  );
};

const ChartsMemo = memo(Charts);

export {
  InDepthScreen,
};
