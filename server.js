require('dotenv').config();
const express = require('express');
const app = express()
const mongoose = require('mongoose')   
const cors = require('cors') 
const expressGraphQL = require('express-graphql').graphqlHTTP
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
  GraphQLNonNull
} = require('graphql')
const Course = require('./models/course')

app.use(cors());
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to Database'))


const CourseType = new GraphQLObjectType({
    name: 'Course',
    description: 'This represents a course',
    fields: () => ({
      _id: { type: GraphQLNonNull(GraphQLString) },
      courseCode: { type: GraphQLNonNull(GraphQLString)  },
      courseName: { type: GraphQLNonNull(GraphQLString) },
      section: { type: GraphQLNonNull(GraphQLString) },
      semester: { type: GraphQLNonNull(GraphQLString) }
    })
  })

  const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({
      course: {
        type: CourseType,
        description: 'A Single Course',
        args: {
          _id: { type: GraphQLString }
        },
        resolve: async (parent, args) => {
            let course
            course = await Course.findById(args._id)
           return course;

        }
      },
      courses: {
        type: new GraphQLList(CourseType),
        description: 'List of All Courses',
        resolve: async () => {
           const course = await Course.find();
            return course;         
        }
      }
    })
  })

  const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root Mutation',
    fields: () => ({
      addCourse: {
        type: CourseType,
        description: 'Add a Course',
        args: {
          courseCode: { type: GraphQLNonNull(GraphQLString) },
          courseName:{ type: GraphQLNonNull(GraphQLString) },
          section:{ type: GraphQLNonNull(GraphQLString) },
          semester:{ type: GraphQLNonNull(GraphQLString) }
          
        },
        resolve: async (parent, args) => {
          const course = new Course({
            courseCode: args.courseCode,
            courseName: args.courseName,
            section: args.section,
            semester: args.semester
          });
          const newCourse = await course.save();
          return newCourse;

        }
        },
        updateCourse: {
            type: CourseType,
            description: 'Update a course',
            args: {
                _id: { type: GraphQLString },
                courseCode: { type: GraphQLNonNull(GraphQLString) },
                courseName:{ type: GraphQLNonNull(GraphQLString) },
                section:{ type: GraphQLNonNull(GraphQLString) },
                semester:{ type: GraphQLNonNull(GraphQLString) }
            },
            resolve: async (parent, args) => {
                const course = await Course.findOne({ _id: args._id }).exec();
                course.courseCode = args.courseCode;
                course.courseName = args.courseName;
                course.section = args.section;
                course.semester = args.semester;
                const updatedCourse = await Course.findByIdAndUpdate(args._id, course, {
                  new: true, // return the updated document
                  useFindAndModify: false // avoid deprecated options
                });
                return updatedCourse;
              }
        },
        deleteCourse: {
            type: CourseType,
            description: 'Delete a course',
            args: {
                _id: {type: GraphQLString}
            },
            resolve: async (parent, args) => {
                const course = await Course.findById(args._id).exec();
                if (!course) {
                  throw new Error('Course not found');
                }
                return course.remove();
              }
        }
    })
  })

const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType
  })

app.use(express.json())
app.use('/courses', expressGraphQL({
schema: schema,
graphiql: true
}));

app.listen(3000, () => console.log('Server Started on port 3000'))