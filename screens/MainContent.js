import React, { useState, useEffect, useContext,useRef, useCallback } from 'react';
import { AppRegistry } from 'react-native';
import { StyleSheet, Text, View, Button,ScrollView,TouchableOpacity,
  RefreshControl,TextInput,Alert,KeyboardAvoidingView } from 'react-native';
import {colors, Header} from 'react-native-elements';
import { ApolloClient, ApolloProvider, InMemoryCache, useQuery,useLazyQuery , createHttpLink, useMutation} from "@apollo/client";

import { GET_CONTINENTS, GET_CONTINENT, SEE_REGIST_LECTURE, GET_USERID } from "../queries";
import { Appbar } from 'react-native-paper';
import { NavigationContainer, useNavigationBuilder } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator,HeaderBackButton } from '@react-navigation/stack';

import { Ionicons } from '@expo/vector-icons';
import { AuthContext, UserContext,IdContext } from '../components/context';
import AsyncStorage from '@react-native-community/async-storage';

import HomeScreen from './HomeScreen'; 
import ScheduleScreen from './ScheduleScreen';
import {SEE_ALL_POSTERS,POST_VIEW,POST_UPLOAD,POST_DELETE,POST_LOAD,COMMENT_UPLOAD,COMMENT_DELETE,POST_INFO}from '../queries'
import { valueFromAST } from 'graphql';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ScreenStackHeaderLeftView } from 'react-native-screens';
//import HyperlinkedText from '../node_modules/react-native-hyperlinked-text/HyperlinkedText'
import { FlatList } from 'react-native-gesture-handler';
import Menu, {MenuItem, MenuDivider} from 'react-native-material-menu';
import { setStatusBarNetworkActivityIndicatorVisible } from 'expo-status-bar';
import { set } from 'react-native-reanimated';

var Bid//보드 아이디
var Uid// 유저 정보(id, grade)
var tnum = 2//게시글/댓글 불러오는 수
var allComment
var allContent
const alaramBoard= [1,2];
const normalBoard =[3,4]; 
const titleLen = 100;
const textLen = 4000;
const commentLen = 1000;
var update = false;
var Datalist
var postupdate = false;
var snum

export function useForceUpdate() {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
    setTick(tick => tick + 1);
  }, [])
  return update;
}

const check = (id) =>{//삭제버튼 띄우는 조건
  //console.log("check!!!!!!!!", id, Uid) 
  if(Uid.id == id || (Bid in normalBoard && Uid.grade == 0 ) ) return true;
  else return false;
}

const UploadPostButton = ({navigation})=>{ //업로드버튼
  return (<View style={{borderWidth:1,position:'absolute',bottom:10,alignSelf:'center'}}>
  <Button
    title="글쓰기"
    accessibilityLabel="글쓰기"
    onPress={()=>{navigation.navigate("Upload")}}
    /> 
</View> );
} 

const CustomMenu = (props) => { //메뉴 버튼
  //console.log("메뉴",props.route);
  let _menu = null;
  return (
    <View style={props.menustyle}>
      <Menu
        ref={(ref) => (_menu = ref)}
        button={
          props.isIcon ? (
            <TouchableOpacity onPress={() => _menu.show()}>
              <Image
                source={{
                  uri:
                    'https://reactnativecode.com/wp-content/uploads/2020/12/menu_icon.png',
                }}
                style={{width: 30, height: 30}}
              />
            </TouchableOpacity>
          ) : (
            <Text
              onPress={() => _menu.show()} 
               >
              {props.menutext}
            </Text>
          )
        }>
        <Text>글 설정</Text>
        <MenuItem onPress={() => {tnum=2;//test중!!!!!!!!바꿔야함
         props.navigation.navigate("Community",{id:props.route.id, name:props.route.name,needquery: true})
        }}>
          2(test용 기본값)
        </MenuItem>
 
        <MenuItem onPress={() => {tnum=40;
         props.navigation.navigate("Community",{id:props.route.id, name:props.route.name,needquery: true})
        }}>40</MenuItem>
 
        <MenuDivider />
 
        <MenuItem onPress={() => {tnum=60;
         props.navigation.navigate("Community",{id:props.route.id, name:props.route.name,needquery: true})
        }}>
          60
        </MenuItem>
      </Menu>
    </View>
  );
};


const Test = React.memo(function Change({post,navigation}){
  //console.log("jhhuhuih",post.item.id);
  return(
    <TouchableOpacity  
    style={styles.line}
    onPress= {()=>{navigation.navigate("Post",{...post.item, num:post.index})}}
     >
    <Text style={{fontSize : 30}}>{post.item.title}</Text>
    <Text style={{fontSize : 13}}>{post.item.text}</Text>
    <Text style={{fontSize: 10}}>댓글수: {post.item.Comment.length}</Text>
    <Text style={{fontSize: 10}}>시간: {post.item.createdAt}</Text>
</TouchableOpacity>

  ); 

});
 


function GetAllPost({route,navigation}){
 // console.log("GetAllPost진입@@@@@@@@@@@@@@")
  //var scroll = 0; 
  //if(!route.params.needquery) scroll = Datalist.scroll;
  //const scrollViewRef= React.useRef()
  //console.log("@@@@@@@@@@@",Datalist.Array);
  const [ 
    fetch, 
    { loading, data }
  ] = useLazyQuery(POST_LOAD,{
    variables: {bid: Bid, snum: snum, tnum: tnum}
});

  if(data!=undefined){
    //console.log("@@@@@fetchnew!!!!!!")
    for(var i=0; i<data.loadPost.length; i++)
      Datalist.Array.push(data.loadPost[i]);
    //console.log(Datalist.Array.length)
  }

  return(  
    <View style={{flex:1}}>
      <FlatList
      keyExtractor={(post) => post.id.toString()}
      data = {Datalist.Array} 
      renderItem ={(post)=>{ 
        //console.log("어슈발뭐지??",post);
          return (
            post == null? (null) : <Test post={post} navigation={navigation}/>
        );
          }}
      windowSize = {2}

      onEndReached={()=>{//console.log("끝!!"); 
            snum+=tnum ;

            if(data == undefined) fetch()
            else{
              if(data.loadPost.length != 0 ) fetch();
            }
            }}

      onEndReachedThreshold={0.1}
      ListFooterComponent={
        data == undefined?
      <Text>로딩중.....</Text>
      :
      data.loadPost.length == 0? 
        <Text>더 이상 불러올 글이 없습니다.</Text> :<Text>로딩중....</Text> 
    }
      />
      <View style={{borderWidth:1,position:'absolute',bottom:10,alignSelf:'center'}}>
  <Button
    title="글쓰기"
    accessibilityLabel="글쓰기"
    onPress={()=>{navigation.navigate("Upload")}}
    /> 
</View>
      </View>
  );
  
}

const SetUpdateGetPost0 = ({start, navigation}) =>{
 // console.log("setupdate",start)
  postupdate = false

  return (<GetPost snum = {start} navigation={navigation} /> );

}


const IinitialPost =({navigation})=>{
  
  //console.log("@@@@@@@@@inital")
  const {loading, error, data} = useQuery(POST_LOAD,{
    variables: {bid: Bid, snum: 0, tnum: tnum}
  });
  if(loading)return <Text>initial로딩....</Text>
  if(error)return <Text>에러!!</Text>

  for(var i=0; i<data.loadPost.length; i++)
  Datalist.Array.push(data.loadPost[i])
  snum += tnum;
   
  return (
    <GetAllPost  navigation={navigation} />
  );

}

const GetPost=({snum,navigation,child=false})=>{
  const forceupdate = useForceUpdate();
   //  console.log("getpost진입",snum)

    const {loading, error, data} = useQuery(POST_LOAD,{
        variables: {bid: Bid, snum: snum, tnum: tnum}
    });
 //
    if(loading) return (<Text>로딩..</Text>);
    if(error) return(<Text>에러!!{error}</Text>);
    //console.log("eos::::",EOS);
    var arr = []
    for(var i=0; i < data.loadPost.length ; i++){
      arr.push([i+snum,data.loadPost[i]])
    }
  //  //console.log(arr);
    //console.log("GetpostDatalist@@@@@@@",Datalist);
  
    if(!postupdate){
  for(var i=0; i<data.loadPost.length; i++)
      Datalist.Array.push(arr[i])
    }
     
     //console.log("@@@@@@@",Datalist);
    return( 
    <View style ={{flex:1}}>
        { 
       arr.map(post =>
          <TouchableOpacity 
            style={styles.line}
            onPress= {()=>{navigation.navigate("Post",{...post[1], num : post[0]})}}
             key={post[1].id}>
            <Text style={{fontSize : 30}}>{post[1].title}</Text>
            <HyperlinkedText style={{fontSize : 13}}>{post[1].text}</HyperlinkedText>
            <Text style={{fontSize: 10}}>댓글수: {post[1].Comment.length}</Text>
            <Text style={{fontSize: 10}}>시간: {post[1].createdAt}</Text>
        </TouchableOpacity>
        ) 
         }{postupdate?
          (<SetUpdateGetPost0 start={snum + tnum}  navigation = {navigation}/>) :
          (
           data.loadPost.length < tnum ? (<Text>더 이상 불러올 글이 없습니다</Text>) : 
           
           (<Button title ="더보기" onPress ={()=>{postupdate = true; forceupdate()}}/>)
           )
        }
    </View>
      );

      //버튼 크기 up필요.가운데로 옮기기
}   



 
export function Community({route, navigation}){
 // console.log("Commnufdisufdfs",route);
  const userInfo = React.useContext(UserContext);
  const client = new ApolloClient({
    uri: "http://52.251.50.212:4000/",
    cache: new InMemoryCache(),
    headers: { 
       Authorization: `Bearer ${userInfo.token}`
      },
  })
  const Id =useContext(IdContext)
  Uid = Id
  Bid = route.params.id
  allComment = null;
  allContent = null;
  if(route.params.needquery){ 
    snum = 0;
    Datalist = {Array:[], scroll:0};
  }
  
  React.useLayoutEffect(() => {
    navigation.setOptions({
 
      headerRight: () => { //새로고침 버튼
        return (
          <View style ={{flexDirection:'row'}}>
          <Button title ="새로고침" onPress ={()=>{
            navigation.navigate("Community",{id:route.params.id, name:route.params.name,needquery: true})}} />
            <CustomMenu
              menutext="Menu"
              menustyle={{marginRight: 14}}
              textStyle={{color: 'white'}}
              navigation={navigation}
              route={{id:route.params.id, name:route.params.name}}
              isIcon={false}
              navigation={navigation}
            />
            </View>
          )
        },  
      headerTitle: ()=>(<Text>{route.params.name}</Text>) //커뮤니티 타이틀바꾸기
      
   }); 
     }, [navigation,route]);


     //잠깐 수정 0131
  return(
  <ApolloProvider client = {client}>
    {route.params.needquery ?
    <IinitialPost navigation={navigation} /> : <GetAllPost navigation={navigation}/>
  }
  </ApolloProvider>
   );
  
}
 
export function Post({route,navigation}){
  //console.log("------------Post----",route);
    const userInfo = React.useContext(UserContext);
    const Id = useContext(IdContext);
    Uid = Id;
    const client = new ApolloClient({
      uri: "http://52.251.50.212:4000/",
      cache: new InMemoryCache(),
      headers: { 
         Authorization: `Bearer ${userInfo.token}`
        },
    })
  
    return(
      <ApolloProvider client = {client}>
        <ViewPost route ={{...route}} navigation={navigation} />
    </ApolloProvider>    
  );
   
  }
   
 
const SetHeader = ({route,navigation,deletePost})=>{ //새로고침,삭제 헤더버튼 추가.
 // console.log("hedear----------------------",route);
  React.useLayoutEffect(() => {
    navigation.setOptions({

      headerRight: () => {
        
        return (
        <View style={{flexDirection:'row'}} >
          <Button title ="새로고침" onPress ={()=>{
            navigation.setParams({upload:true})
            navigation.navigate("Post")}} />
          {check(route.userId) ?
          (<Button title="삭제" onPress={()=>{Alert.alert(
            "글을 삭제하시겠습니까?",
            "",
            [
              {
                text: "예",
                onPress: () => {
                  deletePost(route.id);
                  Datalist.Array[route.num][1] = null;
                  navigation.navigate("Community",{id:Bid,needquery:false})},
                style: "cancel"
              },
              { text: "아니오", onPress: () => {return;} }
            ],
            { cancelable: true }
          );} }/>)

          :

          (null)
          }
          </View>)},

       headerLeft :()=>{//console.log("정신나갈거같에정시난갈거같에정신",route.upload)
       return (route.upload == true) ? (<HeaderBackButton onPress={()=>{navigation.navigate("Community",{needquery: false})}}/>) 
                    :(<HeaderBackButton onPress={()=>{navigation.goBack()}} />)
                  }
      
   } );
     }, [navigation,route]);
     return(null);
}


function ViewPost({route,navigation}){//한 Post 다 출력
  //console.log("----------viewpoint rotue-------------",route)
  const cond = (route.params.upload == true) 
  const [deletePostMutation] = useMutation(POST_DELETE);
  const deletePost = async(pid) =>{
      try{
      const data = await deletePostMutation({
        variables: {
          pid: pid
        }
      }
    )} 
    catch(e){
      console.log(e); 
      }
  }  
  const [uploadMutation] = useMutation(COMMENT_UPLOAD);//
  const uploadComment = async(pid,text) =>{
      try{
      const data = await uploadMutation({
        variables: {
          pid: pid,
          text: text
        }
      }
    );
  }
    catch(e){
      console.log(e); 
      }
  }  

  const [deleteCommentMutatin] = useMutation(COMMENT_DELETE);
  const deleteComment = async(cid) =>{
    try{
    const data = await deleteCommentMutatin({
      variables: {
        cid: cid
      }
    }
  );
} 
  catch(e){
    console.log(e); 
    }
}  
  
if(!cond ){
allContent = [{id:route.params.id, UserId: route.params.UserId, 
              createdAt: route.params.createdAt, text:route.params.texst,
              title:route.params.title, num:route.params.num,
              commentLen:route.params.Comment.length,
              __typename:"Post"}];
allComment = route.params.Comment;
}

  return(
  
  <View style ={{flex:1, paddingHorizontal:10}}>
    <SetHeader route={{id: route.params.id , upload: route.params.upload, userId: route.params.UserId, num:route.params.num}}
       navigation={navigation} deletePost={deletePost}/>
    
    <View >
      {cond?
      <CommentReload route ={{id: route.params.id, userId: route.params.UserId, 
        text:route.params.text, title:route.params.title,
        createdAt : route.params.createdAt, num: route.params.num
      }}
       deleteComment={deleteComment} navigation ={navigation}/>
      :
      <PrintAllContent deleteComment={deleteComment} navigation={navigation}/>
      } 
    </View>
  
  <KeyboardAwareScrollView style={{borderWidth:1,position:'absolute',bottom:10 }}>
      <CommentInput  route={{id: route.params.id}} upload = {uploadComment} navigation ={navigation}/>
  </KeyboardAwareScrollView>
  </View>);
} 
     
var printsnum = 0;
const PrintAllContent = ({deleteComment,navigation}) =>{
 
  //console.log("beforeallcontent!!!!!!!",allContent.length,"printsum",printsnum)
  const forceupdate = useForceUpdate();
  var end = false;
  var i = 0;
  for(;i<tnum ;i++){
  if(allComment[printsnum+i] == undefined){end=true; printsnum=0; break;}
    allContent.push(allComment[i+printsnum]);
  }
   
  //console.log("print!!!!!!!!!!!", allContent.length);
  return(
    <FlatList
    data = {allContent}
    keyExtractor={(post)=>post.createdAt.toString()} 
    renderItem={(post)=>{
      //console.log("가자아아아",post)
      return(
      post.item.__typename == "Post"?
      <PostStyle route={post}/> : <CommentContent route={post} deleteComment={deleteComment} navigation={navigation}/>);}
 
    } 
    onEndReached={()=>{
      //console.log("끝!")
        if(!end){
        //console.log("nono")
         printsnum+=i
         forceupdate(); 
        }}}
    onEndReachedThreshold={0.1}
    ListFooterComponent={!end ?<Text>로딩...</Text>:<Text>더 이상 불러올 댓글이 없습니다.</Text>}
    />
  );

}

const CommentReload = ({route,deleteComment, navigation}) =>{
 // console.log("Reloo가쟈!!!!route ", route)

  const{loading, error, data} = useQuery(POST_VIEW,{ //댓글 불러오는 쿼리
    variables: {pid: route.id}
  })
  if(loading) return (<Text>로딩..</Text>);
  if(error) return(<Text>에러!!{error}</Text>);
  allComment = data.seeAllComment 
  allContent = [{id:route.id, UserId: route.userId, 
    createdAt: route.createdAt, text:route.text,
    title:route.title, num:route.num,
    commentLen:data.seeAllComment.length,
    __typename:"Post"}]; 
  //console.log("바뀐Comment정보!!!!!!!!", data)
  if(data.seeAllComment.length != 0 ){
  const temp = {UserId : route.userId, __typename:"Post", 
          createdAt: route.createdAt, id:route.id,
          text: route.text, title: route.title,
          Comment: data.seeAllComment};
 
  Datalist.Array[route.num] = temp;

  }

  for(var i =0; i<Datalist.Array.length ; i++){
  //console.log("Datalist.array!!!!",Datalist.Array[i].id)
  }
  return(
    
    data.seeAllComment.length != 0?
      <PrintAllContent deleteComment={deleteComment} navigation={navigation}/>
    :
    <SearchPost route ={route} navigation={navigation} deleteComment={deleteComment} />  
    
    
  );
}
  
const SearchPost = ({route,navigation,deleteComment}) =>{
  //console.log("@@@@@@@@@searchpost진입")
  const{loading, error, data} = useQuery(POST_INFO,{ //댓글 불러오는 쿼리
    variables: {pid: route.id}
  })
  if(loading) return (<Text>로딩..</Text>);
  if(error) return(<Text>에러!!{error}</Text>);
 // console.log(data);
  if(data.seePost == null){
    Datalist.Array[route.num] = null;
    Alert.alert("삭제된 게시물입니다.")
    return( null );
  }  
  else {
    const temp = {UserId : route.userId, __typename:"Post", 
    createdAt: route.createdAt, id:route.id,
    text: route.text, title: route.title,
    Comment: []};
    Datalist.Array[route.num] = temp;
  }

  return(
    <PrintAllContent deleteComment={deleteComment} navigation={navigation}/> );
  
} 


const CommentInput=({route,upload,navigation})=>
{
  
  const [text,setText] = useState("");
 // console.log("Commentinput!!!",route);
  return (
    <View styles={{flex:1}}>
  <TextInput
     placeholder="댓글을 입력하세요."
     multiline
     onChangeText={(val)=>setText(val)}
      />
  <Button title="입력" onPress={()=>{
    //console.log("------------------------",route)
    upload(route.id, text);
    navigation.navigate("Post",{upload : true})

  }} />
     </View>);

}
   

 
const CommentContent = React.memo(({route,deleteComment,navigation}) => {
 // console.log("Commentfdsfdsfdsfqfqefqf!!!!!!");
  return(
    <View style={styles.line}>
    <Text style={{fontSize:15}}>익명</Text>
    <Text style={{fontSize:20}}>{route.item.text}{"\n"}</Text>
    <Text style={{fontSize:10}}>시간{route.item.createdAt}</Text>
    { (check(route.item.UserId))?
    <Button title="삭제" onPress={()=>
    {
      deleteComment(route.item.id);
      navigation.navigate("Post",{upload: true});
    }}/> : (null)
  }
    </View>
  );
})
 
const PostStyle = React.memo(({route}) => {
  //console.log("poststtstdsgsijfsifjd!!!",route);
  return(
    <View style={styles.line}>
    <Text style={{fontSize:20}}>익명{"\n"}</Text>
    <Text style={{fontSize:10}}>시간{route.item.createdAt}</Text>
    <Text style={{fontSize:35}}>{route.item.title}</Text>
    <Text style={{fontSize:20}}>{route.item.text}</Text>
    <Text style={{fontSize:10}}>댓글수{route.item.commentLen}</Text>
    </View>
  );
} )
 

const CheckUpload = ({navigation}) => {
  //console.log("eeeeee",bid,typeof(bid));
  const [uploadmutation] = useMutation(POST_UPLOAD);
  const upload = async({bid, title, text}) =>{
    try{
    const data = await uploadmutation({
      variables: {
        bid: Bid,
        title: title,
        text: text
      }
    }
  )}
  catch(e){
    console.log(e); }
  }
  return(<UpdateScreen navigation={navigation} upload={upload} />);
}

export function Upload({route,navigation}) {  
  const userInfo = React.useContext(UserContext);
  const client = new ApolloClient({
    uri: "http://52.251.50.212:4000/",
    cache: new InMemoryCache(),
    headers: {
       Authorization: `Bearer ${userInfo.token}`
      },
  })

  return(<ApolloProvider client={client}>
    <CheckUpload navigation ={navigation} />
    </ApolloProvider>
  );
}
 
const UpdateScreen = ({navigation, upload})=>{
  const [title,setTitle] = useState("");
  const [text, setText] = useState("");

  return(<KeyboardAwareScrollView>

      <View style={{marginTop:30, flexDirection:'row',justifyContent:'space-between'}}>
  <Button title="X" onPress={()=>{
    navigation.goBack()
   }} />
  <Text>글쓰기</Text>
  <Button title="완료"  onPress={() =>{
    if(title =="" || text =="") alert("제목, 글 모두 다 입력하세요.")
    else{
      upload({Bid,title,text});
      navigation.navigate("Community",{id: Bid,needquery:true})
    }   
  }} />
  </View >
  <Text>{title.length}/100</Text>
  <TextInput 
        style={{
          textAlignVertical: "top",
        }}
    placeholder="제목"
    autoCapitalize="none"
    onChangeText={(val)=>setTitle(val)}
    value={title}
    maxLength={titleLen}
     />
   <Text>{text.length}/4000</Text>
  <TextInput 
        style={{
          textAlignVertical: "top",
        }}
    placeholder="내용"
    autoCapitalize="none"
    onChangeText={(val)=>setText(val)}
    multiline={true}
    maxLength={textLen}
    value={text}
     />


</KeyboardAwareScrollView>
  );
}

 
const styles = StyleSheet.create({

  line: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderBottomColor: 'black',
    borderBottomWidth: 1,
  },
  textInput: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 0 : -12,
    paddingLeft: 10,
    width: "90%",
    color: '#05375a',
},
});



