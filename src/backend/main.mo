import Map "mo:core/Map";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let MAX_TITLE_LENGTH = 20;
  let START_OFFSET = 1000;
  let MAX_ADMINS = 3;

  public type Id = Nat;
  public type PrincipalId = Principal;
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
    earningsEnabled : Bool;
    tier : UserTier;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

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
    weight : Int;
    displayMode : Nat;
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

  public type TaskInput = {
    title : Text;
    description : Text;
    urgent : Bool;
    important : Bool;
    isLongTask : Bool;
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

  module List {
    public func compare(a : List, b : List) : Order.Order {
      Nat.compare(a.id, b.id);
    };
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

  public type TaskUpdateInput = {
    title : Text;
    description : Text;
    completed : Bool;
    urgent : Bool;
    important : Bool;
    isLongTask : Bool;
    listId : ListId;
    order : Nat;
  };

  public type TaskCreateInput = {
    title : Text;
    description : Text;
    urgent : Bool;
    important : Bool;
    isLongTask : Bool;
    listId : ListId;
    order : Nat;
  };

  public type User = {
    lists : [List];
    tasks : [Task];
    routines : [MorningRoutine];
    payrollHistory : [PayrollRecord];
    spendRecords : [SpendRecord];
    nextTaskId : TaskId;
    nextListId : ListId;
    nextRoutineId : RoutineId;
    nextSpendId : SpendId;
    lastResetDate : Int;
    displayMode : Nat;
    monetarySettings : MonetarySettings;
    todayEarns : ?TodayEarns;
    principal : PrincipalId;
    earningsEnabled : Bool;
    spendPresets : [SpendPreset];
    nextPresetId : Nat;
  };

  public type SpendInput = {
    amount : Float;
    category : Text;
    spendType : SpendType;
  };

  public type UserOld = {
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
    displayMode : Nat;
    monetarySettings : MonetarySettings;
    todayEarns : ?TodayEarns;
    principal : Principal;
    earningsEnabled : Bool;
    spendPresets : Map.Map<Nat, SpendPreset>;
    nextPresetId : Nat;
  };

  let usersOld = Map.empty<Principal, UserOld>();

  func convertUserDataToImmutable(userData : UserOld) : User {
    {
      userData with
      lists = userData.lists.values().toArray();
      tasks = userData.tasks.values().toArray();
      routines = userData.routines.values().toArray();
      payrollHistory = userData.payrollHistory.values().toArray();
      spendRecords = userData.spendRecords.values().toArray();
      spendPresets = userData.spendPresets.values().toArray();
    };
  };

  func addQuadrantIfMissing(user : UserOld, id : ListId, name : Text, urgent : Bool, important : Bool) {
    if (not user.lists.containsKey(id)) {
      let quadrant : List = {
        id;
        name;
        quadrant = true;
        urgent;
        important;
      };
      user.lists.add(id, quadrant);
    };
  };

  func initializeAllQuadrantsInternal(user : UserOld) {
    addQuadrantIfMissing(user, 1, "Must Do", true, true);
    addQuadrantIfMissing(user, 2, "Should Do", false, true);
    addQuadrantIfMissing(user, 3, "Delegate / Could Do", true, false);
    addQuadrantIfMissing(user, 4, "May Do", false, false);
  };

  // Helper function to ensure caller is authenticated (not anonymous) and auto-assign user role
  func ensureAuthenticatedUser(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot access this resource");
    };
    // Auto-assign user role if not already assigned
    let currentRole = AccessControl.getUserRole(accessControlState, caller);
    switch (currentRole) {
      case (#guest) {
        // Auto-promote guest to user for authenticated principals
        AccessControl.assignRole(accessControlState, caller, caller, #user);
      };
      case (_) {
        // Already has a role (user or admin), no action needed
      };
    };
  };

  // Helper function to create a fresh user with default settings
  func createFreshUser(caller : Principal) : UserOld {
    let defaultMonetarySettings : MonetarySettings = {
      maxMoneyPerDay = 100;
      maxMorningRoutine = 30;
      maxDailyPriorities = 50;
      maxEveningRoutine = 20;
      totalBalance = 0;
    };

    let freshUser : UserOld = {
      lists = Map.empty<ListId, List>();
      tasks = Map.empty<TaskId, Task>();
      routines = Map.empty<RoutineId, MorningRoutine>();
      payrollHistory = Map.empty<Int, PayrollRecord>();
      spendRecords = Map.empty<SpendId, SpendRecord>();
      nextTaskId = START_OFFSET;
      nextListId = 5; // Quadrants use IDs 1-4
      nextRoutineId = START_OFFSET;
      nextSpendId = START_OFFSET;
      lastResetDate = Time.now();
      displayMode = 0;
      monetarySettings = defaultMonetarySettings;
      todayEarns = null;
      principal = caller;
      earningsEnabled = false;
      spendPresets = Map.empty<Nat, SpendPreset>();
      nextPresetId = 1;
    };

    // Initialize quadrants for fresh user
    initializeAllQuadrantsInternal(freshUser);
    freshUser;
  };

  // Helper function to get or create user
  func getOrCreateUser(caller : Principal) : UserOld {
    switch (usersOld.get(caller)) {
      case (?existingUser) { existingUser };
      case (null) {
        let newUser = createFreshUser(caller);
        usersOld.add(caller, newUser);
        newUser;
      };
    };
  };

  // Profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot access profiles");
    };
    ensureAuthenticatedUser(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot access profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot save profiles");
    };
    ensureAuthenticatedUser(caller);
    userProfiles.add(caller, profile);
  };

  // List read endpoint for frontend bootstrap - auto-creates user if needed
  public query ({ caller }) func getAllUserLists() : async ?[List] {
    if (caller.isAnonymous()) {
      return null;
    };
    // Note: In query context we cannot modify state, so we check if user exists
    // If user doesn't exist, frontend should call maybeInitializeAllQuadrants first
    switch (usersOld.get(caller)) {
      case (?user) {
        let lists = user.lists.values().toArray();
        ?lists;
      };
      case (null) { 
         // Return empty array to signal that initialization is needed
         ?([] : [List]);
       };
    };
  };

  // Idempotent quadrant initialization - creates user if needed
  func needQuadrant(user : UserOld, id : ListId, name : Text, urgent : Bool, important : Bool) : Bool {
    not user.lists.containsKey(id);
  };

  func initializeQuadrant(user : UserOld, id : ListId, name : Text, urgent : Bool, important : Bool) : UserOld {
    let quadrant : List = {
      id;
      name;
      quadrant = true;
      urgent;
      important;
    };
    user.lists.add(id, quadrant);
    user;
  };

  func needAllQuadrants(user : UserOld) : Bool {
    needQuadrant(user, 1, "Must Do", true, true) or
    needQuadrant(user, 2, "Should Do", false, true) or
    needQuadrant(user, 3, "Delegate / Could Do", true, false) or
    needQuadrant(user, 4, "May Do", false, false);
  };

  func initializeAllQuadrants(user : UserOld) : UserOld {
    let userWithMustDo = if (needQuadrant(user, 1, "Must Do", true, true)) {
      initializeQuadrant(user, 1, "Must Do", true, true);
    } else { user };
    let userWithShouldDo = if (needQuadrant(userWithMustDo, 2, "Should Do", false, true)) {
      initializeQuadrant(userWithMustDo, 2, "Should Do", false, true);
    } else { userWithMustDo };
    let userWithDelegate = if (needQuadrant(userWithShouldDo, 3, "Delegate / Could Do", true, false)) {
      initializeQuadrant(
        userWithShouldDo,
        3,
        "Delegate / Could Do",
        true,
        false,
      );
    } else { userWithShouldDo };
    if (needQuadrant(userWithDelegate, 4, "May Do", false, false)) {
      initializeQuadrant(userWithDelegate, 4, "May Do", false, false);
    } else { userWithDelegate };
  };

  // Public endpoint for idempotent quadrant initialization
  // Auto-creates user and assigns role if needed - no admin privileges required
  public shared ({ caller }) func maybeInitializeAllQuadrants() : async ?[List] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot initialize quadrants");
    };
    
    // Ensure user role is assigned
    ensureAuthenticatedUser(caller);
    
    // Get or create user
    let user = getOrCreateUser(caller);
    
    // Initialize quadrants if needed
    if (needAllQuadrants(user)) {
      let updatedUser = initializeAllQuadrants(user);
      usersOld.add(caller, updatedUser);
      ?updatedUser.lists.values().toArray();
    } else {
      ?user.lists.values().toArray();
    };
  };
};
