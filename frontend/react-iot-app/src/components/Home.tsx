import WithSubnavigation from "./NavBar";
import IoTSubDataChart from './IoTSubDataChart';
import DynamoDBDataChart from './DynamoDBDataChart';
import React from "react";


interface HomePageProps {
  user: any,
  signOut: any
}


const HomePage = ({ user, signOut }) => {

  const childFunc = React.useRef(null);

  const signOutUnSub = () => {
    childFunc.current();
    window.localStorage.clear();
    signOut();
  }

  return (
    <div>
      <WithSubnavigation user={user} signOut={signOutUnSub}></WithSubnavigation>
      <div>
        <DynamoDBDataChart></DynamoDBDataChart>
        <IoTSubDataChart childFunc={childFunc}></IoTSubDataChart>
      </div>
    </div>
  )
}

export default HomePage; 