export type AttendancePolicy="PRESENT"|"SEPARATE"|"HALF_DAY";
export type AttendanceCounts={present:number;absent:number;late:number;excused:number;leave:number;total:number};
export function attendanceWeight(status:string, policy:AttendancePolicy){if(status==="PRESENT")return 1;if(status==="LATE")return policy==="PRESENT"?1:policy==="HALF_DAY"?0.5:0;return 0;}
export function calculateAttendance(counts:AttendanceCounts, policy:AttendancePolicy){const total=counts.total||0;const earned=counts.present+counts.late*attendanceWeight("LATE",policy);return {earned,total,percentage:total?Number((earned/total*100).toFixed(2)):0};}
