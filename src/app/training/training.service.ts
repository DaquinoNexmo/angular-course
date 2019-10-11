import { Subject } from 'rxjs';

import { Exercise } from './exercise.model';
import { from } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';


@Injectable()
export class TrainingService {

  constructor( private db: AngularFirestore ) {

  }

  exerciseChanged = new Subject<Exercise>();
  exercisesChanged = new Subject<Exercise[]>();
  finishedExercisesChanged = new Subject<Exercise[]>();


  private avaliableExercises: Exercise[] = [];
  private runningExercise: Exercise;
  private exercises: Exercise[] = [];
  private finishedExercises: Exercise[] = []; // when this change I emmit the finishedExercisesChanged event

  fetchAvaliableExercises() {
    this.db.collection('avaliableExercise')
    .snapshotChanges()
    .pipe(map(docArray => {
      return docArray.map(doc => {
        console.log(doc.payload.doc.data()['name'])
        return {
          id: doc.payload.doc.id,
          name: doc.payload.doc.data()['name'],
          duration: doc.payload.doc.data()['duration'],
          calories: doc.payload.doc.data()['calories']
        };
      });
    })).subscribe((exercises: Exercise[]) => {
      this.avaliableExercises = exercises;
      this.exercisesChanged.next([...this.avaliableExercises]);
    });
  }

  startExercise(selectedId: string) {
    console.log(selectedId);
    this.runningExercise = this.avaliableExercises.find(ex => ex.id === selectedId);
    this.exerciseChanged.next({ ... this.runningExercise });
    console.log(this.runningExercise);
  }

  getRunningExercise() {
    return { ...this.runningExercise };
  }

  completeExercise() {
    this.addDataToDatabase({
      ...this.runningExercise,
      date: new Date(),
      state: 'completed'
    });

    this.runningExercise = null;
    this.exerciseChanged.next(null);
  }

  cancelExercise(progress: number) {
    this.addDataToDatabase({
      ...this.runningExercise,
      duration: this.runningExercise.duration * (progress / 100),
      calories: this.runningExercise.calories * (progress / 100),
      date: new Date(),
      state: 'cancelled'
    });

    this.runningExercise = null;
    this.exerciseChanged.next(null);
  }

  fetchCompletedOrCancelledExercises() {
    // this valueChanges only give us a array of document values without the ID of the document.
    // but we dont need the ID here
    this.db.collection('finishedExercises').valueChanges().subscribe((exercises: Exercise[]) => {
      this.finishedExercisesChanged.next(exercises);
    });
  }

  private addDataToDatabase(exercise: Exercise) {
    // if you try to connect to a connection tha not exist yet, fire base create a new one, thats what happens here first time
    this.db.collection('finishedExercises').add(exercise);
  }
}
