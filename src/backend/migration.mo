import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Principal "mo:core/Principal";

module {
  public type Id = Nat;
  public type PrincipalId = Principal.Principal;
  public type TaskId = Nat;
  public type ListId = Nat;
  public type RoutineId = Nat;
  public type SpendId = Nat;
  public type UserTier = {
    #basic;
    #silver;
    #gold;
    #diamond;
  };

  public type UserProfile = {
    name : Text;
    email : ?Text;
    earningsEnabled : Bool;
    tier : UserTier;
  };

  public type MonetarySettings = {
    maxMoneyPerDay : Nat;
    maxMorningRoutine : Nat;
    maxDailyPriorities : Nat;
    maxEveningRoutine : Nat;
    totalBalance : Int;
  };

  public type RoutineSection = {
    #top;
    #bottom;
  };

  public type MorningRoutine = {
    id : RoutineId;
    text : Text;
    completed : Bool;
    section : RoutineSection;
    order : Nat;
    streakCount : Nat;
    strikeCount : Nat;
    weight : Int;
  };

  public type Task = {
    id : TaskId;
    title : Text;
    description : Text;
    completed : Bool;
    urgent : Bool;
    important : Bool;
    isLongTask : Bool;
    weight : Float;
    listId : ListId;
    order : Nat;
  };

  public type List = {
    id : ListId;
    name : Text;
    quadrant : Bool;
    urgent : Bool;
    important : Bool;
  };

  public type PayrollRecord = {
    date : Int;
    total : Int;
    submitted : Bool;
    details : {
      morning : Int;
      priorities : Int;
      evening : Int;
    };
  };

  public type TodayEarns = {
    total : Int;
    submitted : Bool;
    details : {
      morning : Int;
      priorities : Int;
      evening : Int;
    };
  };

  public type SpendType = {
    #normal;
    #preDeducted;
  };

  public type SpendRecord = {
    id : SpendId;
    date : Int;
    amount : Float;
    category : Text;
    spendType : SpendType;
  };

  public type SpendPreset = {
    id : Nat;
    name : Text;
    amount : Float;
    category : Text;
  };

  public type User = {
    lists : Map.Map<ListId, List>;
    tasks : Map.Map<TaskId, Task>;
    routines : Map.Map<RoutineId, MorningRoutine>;
    payrollHistory : Map.Map<Int, PayrollRecord>;
    spendRecords : Map.Map<SpendId, SpendRecord>;
    nextTaskId : TaskId;
    nextListId : ListId;
    nextRoutineId : RoutineId;
    nextSpendId : SpendId;
    lastResetDate : Int;
    monetarySettings : MonetarySettings;
    todayEarns : ?TodayEarns;
    principal : PrincipalId;
    spendPresets : Map.Map<Nat, SpendPreset>;
    nextPresetId : Nat;
  };

  public type TierLimits = {
    maxRoutines : ?Nat;
    maxCustomLists : ?Nat;
    maxTasks : ?Nat;
  };

  public type TierLimitsConfig = {
    basic : TierLimits;
    silver : TierLimits;
    gold : TierLimits;
    diamond : TierLimits;
  };

  public type OldActor = {
    canisterOwner : ?Principal;
    userProfiles : Map.Map<Principal, UserProfile>;
    users : Map.Map<Principal, User>;
    tierLimits : TierLimitsConfig;
  };

  public type NewActor = {
    canisterOwner : ?Principal;
    userProfiles : Map.Map<Principal, UserProfile>;
    users : Map.Map<Principal, User>;
    tierLimits : TierLimitsConfig;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      users = old.users.map<Principal, User, User>(
        func(_principal, user) {
          {
            user with
            routines = user.routines.map<RoutineId, MorningRoutine, MorningRoutine>(
              func(_routineId, routine) {
                {
                  routine with
                  strikeCount = 0;
                };
              }
            );
          };
        }
      );
    };
  };
};
